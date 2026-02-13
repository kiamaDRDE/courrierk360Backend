// src/classe-courrier/classe-courrier.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { SearchService } from '../common/search.service';
import { CreateClasseCourrierDto } from './dto/create-classe-courrier.dto';
import { UpdateClasseCourrierDto } from './dto/update-classe-courrier.dto';
import { CLASSE_COURRIER_SEARCH_CONFIG } from './classe-courrier.config';

@Injectable()
export class ClasseCourrierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
    private readonly searchService: SearchService,
  ) {}

  /**
   * Créer une nouvelle classe de courrier
   */
  async create(createDto: CreateClasseCourrierDto) {
    // Vérifier si une classe avec ce nom existe déjà
    const existing = await this.prisma.classeCourrier.findUnique({
      where: { nom: createDto.nom },
    });

    if (existing) {
      throw new ConflictException(
        this.responseFormatter.conflict(
          'Classe de courrier existante',
          `Une classe de courrier avec le nom "${createDto.nom}" existe déjà.`,
        ),
      );
    }

    // Créer la classe de courrier
    const classeCourrier = await this.prisma.classeCourrier.create({
      data: createDto,
    });

    return this.responseFormatter.created(
      classeCourrier,
      'Classe de courrier créée',
      'La classe de courrier a été créée avec succès.',
    );
  }

  /**
   * Récupérer toutes les classes de courrier avec pagination et recherche
   */
  async findAll(search?: string, page: number = 1, limit: number = 10) {
    // Valider les paramètres de pagination
    const { page: validPage, limit: validLimit } =
      this.paginationService.validatePaginationParams(page, limit);

    // Construire la clause WHERE avec recherche
    const where = this.searchService.buildSearchWhere(
      search,
      CLASSE_COURRIER_SEARCH_CONFIG,
    );

    // Calculer l'offset
    const skip = this.paginationService.getSkip(validPage, validLimit);

    // Récupérer les données
    const [items, total] = await Promise.all([
      this.prisma.classeCourrier.findMany({
        where,
        skip,
        take: validLimit,
        orderBy: { nom: 'asc' },
      }),
      this.prisma.classeCourrier.count({ where }),
    ]);

    // Créer le résultat paginé
    const paginatedResult = this.paginationService.createPaginatedResult(
      items,
      validPage,
      validLimit,
      total,
    );

    // Retourner la réponse formatée
    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des classes de courrier',
      search
        ? `${items.length} classe(s) de courrier trouvée(s) pour "${search}".`
        : `${items.length} classe(s) de courrier récupérée(s).`,
    );
  }

  /**
   * Récupérer une classe de courrier par son ID
   */
  async findOne(id: number) {
    const classeCourrier = await this.prisma.classeCourrier.findUnique({
      where: { id },
    });

    if (!classeCourrier) {
      throw new NotFoundException(
        this.responseFormatter.notFound(
          'Classe de courrier non trouvée',
          `Aucune classe de courrier trouvée avec l'ID ${id}.`,
        ),
      );
    }

    return this.responseFormatter.success(
      classeCourrier,
      'Classe de courrier récupérée',
      'Les informations de la classe de courrier ont été récupérées avec succès.',
    );
  }

  /**
   * Mettre à jour une classe de courrier
   */
  async update(id: number, updateDto: UpdateClasseCourrierDto) {
    // Vérifier si la classe de courrier existe
    const existing = await this.prisma.classeCourrier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        this.responseFormatter.notFound(
          'Classe de courrier non trouvée',
          `Aucune classe de courrier trouvée avec l'ID ${id}.`,
        ),
      );
    }

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (updateDto.nom && updateDto.nom !== existing.nom) {
      const duplicate = await this.prisma.classeCourrier.findUnique({
        where: { nom: updateDto.nom },
      });

      if (duplicate) {
        throw new ConflictException(
          this.responseFormatter.conflict(
            'Nom déjà utilisé',
            `Une classe de courrier avec le nom "${updateDto.nom}" existe déjà.`,
          ),
        );
      }
    }

    // Mettre à jour la classe de courrier
    const updated = await this.prisma.classeCourrier.update({
      where: { id },
      data: updateDto,
    });

    return this.responseFormatter.updated(
      updated,
      'Classe de courrier modifiée',
      'La classe de courrier a été modifiée avec succès.',
    );
  }

  /**
   * Supprimer une classe de courrier
   */
  async remove(id: number) {
    // Vérifier si la classe de courrier existe
    const existing = await this.prisma.classeCourrier.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        this.responseFormatter.notFound(
          'Classe de courrier non trouvée',
          `Aucune classe de courrier trouvée avec l'ID ${id}.`,
        ),
      );
    }

    // Supprimer la classe de courrier
    await this.prisma.classeCourrier.delete({
      where: { id },
    });

    return this.responseFormatter.deleted(
      'Classe de courrier supprimée',
      'La classe de courrier a été supprimée avec succès.',
      { id },
    );
  }
}
