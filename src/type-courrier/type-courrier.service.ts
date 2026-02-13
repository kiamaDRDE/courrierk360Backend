// src/type-courrier/type-courrier.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { SearchService } from '../common/search.service';
import { CreateTypeCourrierDto } from './dto/create-type-courrier.dto';
import { UpdateTypeCourrierDto } from './dto/update-type-courrier.dto';
import { typeCourrierSearchConfig } from './type-courrier.config';

@Injectable()
export class TypeCourrierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
    private readonly searchService: SearchService,
  ) {}

  async create(createDto: CreateTypeCourrierDto) {
    // Vérifier si un type de courrier avec ce nom existe déjà
    const existing = await this.prisma.typeCourrier.findUnique({
      where: { nom: createDto.nom },
    });

    if (existing) {
      return this.responseFormatter.conflict(
        'Type de courrier existant',
        `Un type de courrier avec le nom "${createDto.nom}" existe déjà.`,
      );
    }

    const typeCourrier = await this.prisma.typeCourrier.create({
      data: createDto,
    });

    return this.responseFormatter.created(
      typeCourrier,
      'Type de courrier créé',
      'Le type de courrier a été créé avec succès.',
    );
  }

  async findAll(
    search?: string,
    classeCourrier?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // Validation et calcul de pagination
    this.paginationService.validatePaginationParams(page, limit);
    const skip = this.paginationService.getSkip(page, limit);

    // Construction du WHERE avec recherche et filtre
    const where: any = {
      isDelete: false,
    };

    // Ajouter la recherche
    if (search) {
      const searchWhere = this.searchService.buildSearchWhere(
        search,
        typeCourrierSearchConfig,
      );
      Object.assign(where, searchWhere);
    }

    // Ajouter le filtre par classe de courrier
    if (classeCourrier) {
      where.classeCourrier = classeCourrier;
    }

    // Récupérer les données
    const [items, totalItems] = await Promise.all([
      this.prisma.typeCourrier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.typeCourrier.count({ where }),
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
      'Liste des types de courrier',
      `${totalItems} type(s) de courrier récupéré(s).`,
    );
  }

  async findOne(id: number) {
    const typeCourrier = await this.prisma.typeCourrier.findUnique({
      where: { id },
    });

    if (!typeCourrier) {
      return this.responseFormatter.notFound(
        'Type de courrier non trouvé',
        `Aucun type de courrier trouvé avec l'ID ${id}.`,
      );
    }

    if (typeCourrier.isDelete) {
      return this.responseFormatter.notFound(
        'Type de courrier supprimé',
        `Le type de courrier avec l'ID ${id} a été supprimé.`,
      );
    }

    return this.responseFormatter.success(
      typeCourrier,
      'Type de courrier récupéré',
      'Les informations du type de courrier ont été récupérées avec succès.',
    );
  }

  async update(id: number, updateDto: UpdateTypeCourrierDto) {
    // Vérifier si le type de courrier existe
    const existing = await this.prisma.typeCourrier.findUnique({
      where: { id },
    });

    if (!existing) {
      return this.responseFormatter.notFound(
        'Type de courrier non trouvé',
        `Aucun type de courrier trouvé avec l'ID ${id}.`,
      );
    }

    if (existing.isDelete) {
      return this.responseFormatter.conflict(
        'Type de courrier supprimé',
        `Le type de courrier avec l'ID ${id} a été supprimé et ne peut pas être modifié.`,
      );
    }

    // Vérifier si le nouveau nom existe déjà (si le nom est modifié)
    if (updateDto.nom && updateDto.nom !== existing.nom) {
      const duplicate = await this.prisma.typeCourrier.findUnique({
        where: { nom: updateDto.nom },
      });

      if (duplicate) {
        return this.responseFormatter.conflict(
          'Nom déjà utilisé',
          `Un type de courrier avec le nom "${updateDto.nom}" existe déjà.`,
        );
      }
    }

    const typeCourrier = await this.prisma.typeCourrier.update({
      where: { id },
      data: updateDto,
    });

    return this.responseFormatter.updated(
      typeCourrier,
      'Type de courrier modifié',
      'Le type de courrier a été modifié avec succès.',
    );
  }

  async remove(id: number) {
    // Vérifier si le type de courrier existe
    const existing = await this.prisma.typeCourrier.findUnique({
      where: { id },
    });

    if (!existing) {
      return this.responseFormatter.notFound(
        'Type de courrier non trouvé',
        `Aucun type de courrier trouvé avec l'ID ${id}.`,
      );
    }

    if (existing.isDelete) {
      return this.responseFormatter.conflict(
        'Type de courrier déjà supprimé',
        `Le type de courrier avec l'ID ${id} a déjà été supprimé.`,
      );
    }

    // Suppression logique
    const typeCourrier = await this.prisma.typeCourrier.update({
      where: { id },
      data: { isDelete: true },
    });

    return this.responseFormatter.deleted(
      'Type de courrier supprimé',
      'Le type de courrier a été supprimé logiquement avec succès.',
      typeCourrier,
    );
  }

  async removePermanently(id: number) {
    // Vérifier si le type de courrier existe
    const existing = await this.prisma.typeCourrier.findUnique({
      where: { id },
      include: {
        courriers: {
          take: 1,
        },
      },
    });

    if (!existing) {
      return this.responseFormatter.notFound(
        'Type de courrier non trouvé',
        `Aucun type de courrier trouvé avec l'ID ${id}.`,
      );
    }

    // Vérifier si le type de courrier est utilisé par des courriers
    if (existing.courriers && existing.courriers.length > 0) {
      return this.responseFormatter.conflict(
        'Type de courrier utilisé',
        `Le type de courrier ne peut pas être supprimé car il est utilisé par des courriers existants.`,
      );
    }

    // Suppression définitive
    const typeCourrier = await this.prisma.typeCourrier.delete({
      where: { id },
    });

    return this.responseFormatter.deleted(
      'Type de courrier supprimé définitivement',
      'Le type de courrier a été supprimé définitivement avec succès.',
      typeCourrier,
    );
  }
}
