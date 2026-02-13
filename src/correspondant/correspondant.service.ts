// src/correspondant/correspondant.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { SearchService } from '../common/search.service';
import { CreateCorrespondantDto } from './dto/create-correspondant.dto';
import { UpdateCorrespondantDto } from './dto/update-correspondant.dto';
import { correspondantSearchConfig } from './correspondant.config';

@Injectable()
export class CorrespondantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
    private readonly searchService: SearchService,
  ) {}

  async create(createDto: CreateCorrespondantDto) {
    // Vérifier que toutes les catégories existent
    const categories = await this.prisma.categories.findMany({
      where: {
        id: { in: createDto.categories },
        isDelete: false,
      },
    });

    if (categories.length !== createDto.categories.length) {
      return this.responseFormatter.validationError(
        'Catégories invalides',
        'Une ou plusieurs catégories sélectionnées n\'existent pas ou ont été supprimées.',
      );
    }

    // Créer le correspondant avec ses catégories
    const { categories: categoryIds, ...correspondantData } = createDto;

    const correspondant = await this.prisma.correspondant.create({
      data: {
        ...correspondantData,
        categories: {
          create: categoryIds.map((categorieId) => ({
            categorie: { connect: { id: categorieId } },
          })),
        },
      },
      include: {
        categories: {
          include: {
            categorie: true,
          },
        },
      },
    });

    return this.responseFormatter.created(
      correspondant,
      'Correspondant créé',
      'Le correspondant a été créé avec succès.',
    );
  }

  async findAll(
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // Validation et calcul de pagination
    this.paginationService.validatePaginationParams(page, limit);
    const skip = this.paginationService.getSkip(page, limit);

    // Construction du WHERE avec recherche
    const where: any = {
      isDelete: false,
    };

    // Ajouter la recherche
    if (search) {
      const searchWhere = this.searchService.buildSearchWhere(
        search,
        correspondantSearchConfig,
      );
      Object.assign(where, searchWhere);
    }

    // Récupérer les données
    const [items, totalItems] = await Promise.all([
      this.prisma.correspondant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: {
            include: {
              categorie: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.correspondant.count({ where }),
    ]);

    // Créer les métadonnées de pagination
    const paginationMeta = this.paginationService.createPaginationMeta(
      totalItems,
      page,
      limit,
    );

    // Créer le résultat paginé
    const paginatedResult = {
      items,
      pagination: paginationMeta,
    };

    // Retourner la réponse paginée
    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des correspondants',
      `${totalItems} correspondant(s) récupéré(s).`,
    );
  }

  async findOne(id: number) {
    const correspondant = await this.prisma.correspondant.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            categorie: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    if (!correspondant) {
      return this.responseFormatter.notFound(
        'Correspondant non trouvé',
        `Aucun correspondant trouvé avec l'ID ${id}.`,
      );
    }

    if (correspondant.isDelete) {
      return this.responseFormatter.notFound(
        'Correspondant supprimé',
        `Le correspondant avec l'ID ${id} a été supprimé.`,
      );
    }

    return this.responseFormatter.success(
      correspondant,
      'Correspondant récupéré',
      'Les informations du correspondant ont été récupérées avec succès.',
    );
  }

  async update(id: number, updateDto: UpdateCorrespondantDto) {
    // Vérifier si le correspondant existe
    const existing = await this.prisma.correspondant.findUnique({
      where: { id },
    });

    if (!existing) {
      return this.responseFormatter.notFound(
        'Correspondant non trouvé',
        `Aucun correspondant trouvé avec l'ID ${id}.`,
      );
    }

    if (existing.isDelete) {
      return this.responseFormatter.conflict(
        'Correspondant supprimé',
        `Le correspondant avec l'ID ${id} a été supprimé et ne peut pas être modifié.`,
      );
    }

    // Si les catégories sont mises à jour, vérifier qu'elles existent
    if (updateDto.categories) {
      const categories = await this.prisma.categories.findMany({
        where: {
          id: { in: updateDto.categories },
          isDelete: false,
        },
      });

      if (categories.length !== updateDto.categories.length) {
        return this.responseFormatter.validationError(
          'Catégories invalides',
          'Une ou plusieurs catégories sélectionnées n\'existent pas ou ont été supprimées.',
        );
      }
    }

    // Préparer les données de mise à jour
    const { categories: categoryIds, ...correspondantData } = updateDto;

    // Mettre à jour le correspondant
    const correspondant = await this.prisma.correspondant.update({
      where: { id },
      data: {
        ...correspondantData,
        ...(categoryIds && {
          categories: {
            // Supprimer les anciennes relations
            deleteMany: {},
            // Créer les nouvelles relations
            create: categoryIds.map((categorieId) => ({
              categorie: { connect: { id: categorieId } },
            })),
          },
        }),
      },
      include: {
        categories: {
          include: {
            categorie: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    return this.responseFormatter.updated(
      correspondant,
      'Correspondant modifié',
      'Le correspondant a été modifié avec succès.',
    );
  }

  async remove(id: number) {
    // Vérifier si le correspondant existe
    const existing = await this.prisma.correspondant.findUnique({
      where: { id },
    });

    if (!existing) {
      return this.responseFormatter.notFound(
        'Correspondant non trouvé',
        `Aucun correspondant trouvé avec l'ID ${id}.`,
      );
    }

    if (existing.isDelete) {
      return this.responseFormatter.conflict(
        'Correspondant déjà supprimé',
        `Le correspondant avec l'ID ${id} a déjà été supprimé.`,
      );
    }

    // Suppression logique
    const correspondant = await this.prisma.correspondant.update({
      where: { id },
      data: { isDelete: true },
      include: {
        categories: {
          include: {
            categorie: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    return this.responseFormatter.deleted(
      'Correspondant supprimé',
      'Le correspondant a été supprimé logiquement avec succès.',
      correspondant,
    );
  }

  async removePermanently(id: number) {
    // Vérifier si le correspondant existe
    const existing = await this.prisma.correspondant.findUnique({
      where: { id },
      include: {
        courriers: { take: 1 },
        courrierDeparts: { take: 1 },
        users: { take: 1 },
      },
    });

    if (!existing) {
      return this.responseFormatter.notFound(
        'Correspondant non trouvé',
        `Aucun correspondant trouvé avec l'ID ${id}.`,
      );
    }

    // Vérifier si le correspondant est utilisé
    const isUsed =
      (existing.courriers && existing.courriers.length > 0) ||
      (existing.courrierDeparts && existing.courrierDeparts.length > 0) ||
      (existing.users && existing.users.length > 0);

    if (isUsed) {
      return this.responseFormatter.conflict(
        'Correspondant utilisé',
        'Le correspondant ne peut pas être supprimé car il est utilisé par des courriers, courriers de départ ou utilisateurs existants.',
      );
    }

    // Suppression définitive (les relations CategoriesCorrespondant seront supprimées en cascade)
    const correspondant = await this.prisma.correspondant.delete({
      where: { id },
      include: {
        categories: {
          include: {
            categorie: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    return this.responseFormatter.deleted(
      'Correspondant supprimé définitivement',
      'Le correspondant a été supprimé définitivement avec succès.',
      correspondant,
    );
  }
}
