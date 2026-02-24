// src/categories/categories.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { SearchService } from '../common/search.service';
import { CreateCategoriesDto } from './dto/create-categories.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';
import { categoriesSearchConfig } from './categories.config';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
    private readonly searchService: SearchService,
  ) {}

  async create(createDto: CreateCategoriesDto) {
    // Vérifier si une catégorie avec ce nom existe déjà
    const existing = await this.prisma.categories.findUnique({
      where: { nom: createDto.nom },
    });

    if (existing) {
      return this.responseFormatter.conflict(
        'Catégorie existante',
        `Une catégorie avec le nom "${createDto.nom}" existe déjà.`,
      );
    }

    const categorie = await this.prisma.categories.create({
      data: createDto,
    });

    return this.responseFormatter.created(
      categorie,
      'Catégorie créée',
      'La catégorie a été créée avec succès.',
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
        categoriesSearchConfig,
      );
      Object.assign(where, searchWhere);
    }

    // Récupérer les données
    const [items, totalItems] = await Promise.all([
      this.prisma.categories.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.categories.count({ where }),
    ]);

    // Créer les métadonnées de pagination
    const paginationMeta = this.paginationService.createPaginationMeta(
      page,
      limit,
      totalItems,
    );

    // Créer le résultat paginé
    const paginatedResult = {
      items,
      pagination: paginationMeta,
    };

    // Retourner la réponse paginée
    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des catégories',
      `${totalItems} catégorie(s) récupérée(s).`,
    );
  }

  async findOne(id: number) {
    const categorie = await this.prisma.categories.findUnique({
      where: { id },
    });

    if (!categorie) {
      return this.responseFormatter.notFound(
        'Catégorie non trouvée',
        `Aucune catégorie trouvée avec l'ID ${id}.`,
      );
    }

    if (categorie.isDelete) {
      return this.responseFormatter.notFound(
        'Catégorie supprimée',
        `La catégorie avec l'ID ${id} a été supprimée.`,
      );
    }

    return this.responseFormatter.success(
      categorie,
      'Catégorie récupérée',
      'Les informations de la catégorie ont été récupérées avec succès.',
    );
  }

  async update(id: number, updateDto: UpdateCategoriesDto) {
    // Vérifier si la catégorie existe
    const existing = await this.prisma.categories.findUnique({
      where: { id },
    });

    if (!existing) {
      return this.responseFormatter.notFound(
        'Catégorie non trouvée',
        `Aucune catégorie trouvée avec l'ID ${id}.`,
      );
    }

    if (existing.isDelete) {
      return this.responseFormatter.conflict(
        'Catégorie supprimée',
        `La catégorie avec l'ID ${id} a été supprimée et ne peut pas être modifiée.`,
      );
    }

    // Vérifier si le nouveau nom existe déjà (si le nom est modifié)
    if (updateDto.nom && updateDto.nom !== existing.nom) {
      const duplicate = await this.prisma.categories.findUnique({
        where: { nom: updateDto.nom },
      });

      if (duplicate) {
        return this.responseFormatter.conflict(
          'Nom déjà utilisé',
          `Une catégorie avec le nom "${updateDto.nom}" existe déjà.`,
        );
      }
    }

    const categorie = await this.prisma.categories.update({
      where: { id },
      data: updateDto,
    });

    return this.responseFormatter.updated(
      categorie,
      'Catégorie modifiée',
      'La catégorie a été modifiée avec succès.',
    );
  }

  async remove(id: number) {
    // Vérifier si la catégorie existe
    const existing = await this.prisma.categories.findUnique({
      where: { id },
    });

    if (!existing) {
      return this.responseFormatter.notFound(
        'Catégorie non trouvée',
        `Aucune catégorie trouvée avec l'ID ${id}.`,
      );
    }

    if (existing.isDelete) {
      return this.responseFormatter.conflict(
        'Catégorie déjà supprimée',
        `La catégorie avec l'ID ${id} a déjà été supprimée.`,
      );
    }

    // Suppression logique
    const categorie = await this.prisma.categories.update({
      where: { id },
      data: { isDelete: true },
    });

    return this.responseFormatter.deleted(
      'Catégorie supprimée',
      'La catégorie a été supprimée logiquement avec succès.',
      categorie,
    );
  }

  async removePermanently(id: number) {
    // Vérifier si la catégorie existe
    const existing = await this.prisma.categories.findUnique({
      where: { id },
      include: {
        correspondants: {
          take: 1,
        },
      },
    });

    if (!existing) {
      return this.responseFormatter.notFound(
        'Catégorie non trouvée',
        `Aucune catégorie trouvée avec l'ID ${id}.`,
      );
    }

    // Vérifier si la catégorie est utilisée par des correspondants
    if (existing.correspondants && existing.correspondants.length > 0) {
      return this.responseFormatter.conflict(
        'Catégorie utilisée',
        'La catégorie ne peut pas être supprimée car elle est utilisée par des correspondants existants.',
      );
    }

    // Suppression définitive
    const categorie = await this.prisma.categories.delete({
      where: { id },
    });

    return this.responseFormatter.deleted(
      'Catégorie supprimée définitivement',
      'La catégorie a été supprimée définitivement avec succès.',
      categorie,
    );
  }
}
