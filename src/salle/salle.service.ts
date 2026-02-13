// src/salle/salle.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalleDto } from './dto/create-salle.dto';
import { UpdateSalleDto } from './dto/update-salle.dto';
import { SalleQueryDto } from './dto/salle-query.dto';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';

@Injectable()
export class SalleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
  ) {}

  // 📝 Créer une salle
  async create(createSalleDto: CreateSalleDto) {
    const { nom, isActive } = createSalleDto;

    // Vérifier si le nom existe déjà
    const existingSalle = await this.prismaService.salle.findFirst({
      where: { nom, isDelete: false },
    });

    if (existingSalle) {
      throw new BadRequestException('Une salle avec ce nom existe déjà.');
    }

    const salle = await this.prismaService.salle.create({
      data: {
        nom,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return this.responseFormatter.success(
      salle,
      'Création salle',
      'Salle créée avec succès.',
    );
  }

  // 📋 Liste de toutes les salles avec filtres et pagination
  async findAll(query: SalleQueryDto) {
    const { page = 1, limit = 10, search, isActive, isDelete } = query;

    // Construction des filtres
    const where: any = {};

    // Filtre par recherche globale
    if (search) {
      where.nom = { contains: search };
    }

    // Filtre par statut actif
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filtre par suppression logique
    if (isDelete !== undefined) {
      where.isDelete = isDelete;
    } else {
      // Par défaut, exclure les salles supprimées
      where.isDelete = false;
    }

    const total = await this.prismaService.salle.count({ where });

    // Si limit est 0, retourner tous les résultats
    if (limit === 0) {
      const salles = await this.prismaService.salle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return this.responseFormatter.success(
        {
          salles,
          pagination: {
            total,
            page: 1,
            limit: total,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        'Liste des salles',
        `${total} salle(s) récupérée(s) avec succès.`,
      );
    }

    // Pagination normale
    const skip = this.paginationService.getSkip(page, limit);
    const totalPages = Math.ceil(total / limit);

    const salles = await this.prismaService.salle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return this.responseFormatter.success(
      {
        salles,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Liste des salles',
      `${salles.length} salle(s) sur ${total} récupérée(s) avec succès.`,
    );
  }

  // 🔍 Récupérer une salle par ID
  async findOne(id: number) {
    const salle = await this.prismaService.salle.findUnique({
      where: { id },
    });

    if (!salle) {
      throw new NotFoundException('Salle non trouvée.');
    }

    return this.responseFormatter.success(
      salle,
      'Détails de la salle',
      'Salle récupérée avec succès.',
    );
  }

  // ✏️ Mettre à jour une salle
  async update(id: number, updateSalleDto: UpdateSalleDto) {
    // Vérifier si la salle existe
    const existingSalle = await this.prismaService.salle.findUnique({
      where: { id },
    });

    if (!existingSalle) {
      throw new NotFoundException('Salle non trouvée.');
    }

    // Vérifier l'unicité du nom si modifié
    if (updateSalleDto.nom && updateSalleDto.nom !== existingSalle.nom) {
      const duplicateSalle = await this.prismaService.salle.findFirst({
        where: {
          nom: updateSalleDto.nom,
          isDelete: false,
          id: { not: id },
        },
      });

      if (duplicateSalle) {
        throw new BadRequestException('Une salle avec ce nom existe déjà.');
      }
    }

    const updatedSalle = await this.prismaService.salle.update({
      where: { id },
      data: updateSalleDto,
    });

    return this.responseFormatter.success(
      updatedSalle,
      'Mise à jour salle',
      'Salle mise à jour avec succès.',
    );
  }

  // 🗑️ Suppression logique (soft delete)
  async softDelete(id: number) {
    const salle = await this.prismaService.salle.findUnique({
      where: { id },
    });

    if (!salle) {
      throw new NotFoundException('Salle non trouvée.');
    }

    if (salle.isDelete) {
      throw new BadRequestException('Cette salle est déjà supprimée.');
    }

    const deletedSalle = await this.prismaService.salle.update({
      where: { id },
      data: { isDelete: true },
    });

    return this.responseFormatter.success(
      { id: deletedSalle.id },
      'Suppression logique',
      'Salle supprimée logiquement avec succès.',
    );
  }

  // 🗑️ Suppression définitive (hard delete)
  async hardDelete(id: number) {
    const salle = await this.prismaService.salle.findUnique({
      where: { id },
    });

    if (!salle) {
      throw new NotFoundException('Salle non trouvée.');
    }

    await this.prismaService.salle.delete({
      where: { id },
    });

    return this.responseFormatter.success(
      { id },
      'Suppression définitive',
      'Salle supprimée définitivement avec succès.',
    );
  }
}
