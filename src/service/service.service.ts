// src/service/service.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { SearchService } from '../common/search.service';

@Injectable()
export class ServiceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
    private readonly searchService: SearchService,
  ) {}

  // 📝 Créer un service
  async create(createServiceDto: CreateServiceDto) {
    const { nom, sigle, type, parentId, isActive, isVisible } = createServiceDto;

    // Vérifier si le nom existe déjà
    const existingService = await this.prismaService.service.findFirst({
      where: { nom, isDelete: false },
    });

    if (existingService) {
      throw new BadRequestException('Un service avec ce nom existe déjà.');
    }

    // Vérifier que le service parent existe si fourni
    if (parentId) {
      const parent = await this.prismaService.service.findFirst({
        where: { id: parentId, isDelete: false },
      });

      if (!parent) {
        throw new BadRequestException(`Le service parent avec l'ID ${parentId} n'existe pas.`);
      }
    }

    const service = await this.prismaService.service.create({
      data: {
        nom,
        sigle,
        type,
        parentId,
        isActive: isActive !== undefined ? isActive : true,
        isVisible: isVisible !== undefined ? isVisible : true,
      },
      include: {
        parent: {
          select: {
            id: true,
            nom: true,
            sigle: true,
          },
        },
      },
    });

    return this.responseFormatter.success(
      service,
      'Création service',
      'Service créé avec succès.',
    );
  }

  // 📋 Liste de tous les services avec filtres et pagination
  async findAll(query: ServiceQueryDto) {
    const { page = 1, limit = 10, search, type, isActive, isDelete, parentId } = query;

    // Construction des filtres
    const where: any = {};

    // Filtre par recherche globale
    if (search) {
      where.OR = [
        { nom: { contains: search } },
        { sigle: { contains: search } },
        { type: { contains: search } },
      ];
    }

    // Filtre par type
    if (type) {
      where.type = type;
    }

    // Filtre par statut actif
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filtre par suppression logique
    if (isDelete !== undefined) {
      where.isDelete = isDelete;
    } else {
      // Par défaut, exclure les services supprimés
      where.isDelete = false;
    }

    // Filtre par service parent
    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const total = await this.prismaService.service.count({ where });

    // Si limit est 0, retourner tous les résultats
    if (limit === 0) {
      const servicesData = await this.prismaService.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: {
            select: {
              id: true,
              nom: true,
            },
          },
        },
      });

      // Transformer parent en idServiceParent
      const services = servicesData.map(({ parent, ...service }) => ({
        ...service,
        idServiceParent: parent || null,
      }));

      return this.responseFormatter.success(
        {
          services,
          pagination: {
            total,
            page: 1,
            limit: total,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        'Liste des services',
        `${total} service(s) récupéré(s) avec succès.`,
      );
    }

    // Pagination normale
    const skip = this.paginationService.getSkip(page, limit);
    const totalPages = Math.ceil(total / limit);

    const servicesData = await this.prismaService.service.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        parent: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    // Transformer parent en idServiceParent
    const services = servicesData.map(({ parent, ...service }) => ({
      ...service,
      idServiceParent: parent || null,
    }));

    return this.responseFormatter.success(
      {
        services,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Liste des services',
      `${services.length} service(s) sur ${total} récupéré(s) avec succès.`,
    );
  }

  // 🔍 Récupérer un service par ID
  async findOne(id: number) {
    const serviceData = await this.prismaService.service.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    if (!serviceData) {
      throw new NotFoundException('Service non trouvé.');
    }

    // Transformer parent en idServiceParent
    const { parent, ...service } = serviceData;
    const result = {
      ...service,
      idServiceParent: parent || null,
    };

    return this.responseFormatter.success(
      result,
      'Détails du service',
      'Service récupéré avec succès.',
    );
  }

  // ✏️ Mettre à jour un service
  async update(id: number, updateServiceDto: UpdateServiceDto) {
    // Vérifier si le service existe
    const existingService = await this.prismaService.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundException('Service non trouvé.');
    }

    // Vérifier l'unicité du nom si modifié
    if (updateServiceDto.nom && updateServiceDto.nom !== existingService.nom) {
      const duplicateService = await this.prismaService.service.findFirst({
        where: {
          nom: updateServiceDto.nom,
          isDelete: false,
          id: { not: id },
        },
      });

      if (duplicateService) {
        throw new BadRequestException('Un service avec ce nom existe déjà.');
      }
    }

    // Vérifier que le service parent existe si fourni
    if (updateServiceDto.parentId) {
      // Empêcher un service d'être son propre parent
      if (updateServiceDto.parentId === id) {
        throw new BadRequestException('Un service ne peut pas être son propre parent.');
      }

      const parent = await this.prismaService.service.findFirst({
        where: { id: updateServiceDto.parentId, isDelete: false },
      });

      if (!parent) {
        throw new BadRequestException(`Le service parent avec l'ID ${updateServiceDto.parentId} n'existe pas.`);
      }
    }

    const updatedService = await this.prismaService.service.update({
      where: { id },
      data: updateServiceDto,
      include: {
        parent: {
          select: {
            id: true,
            nom: true,
            sigle: true,
          },
        },
        children: {
          select: {
            id: true,
            nom: true,
            sigle: true,
          },
        },
      },
    });

    return this.responseFormatter.success(
      updatedService,
      'Mise à jour service',
      'Service mis à jour avec succès.',
    );
  }

  // 🗑️ Suppression logique (soft delete)
  async softDelete(id: number) {
    const service = await this.prismaService.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service non trouvé.');
    }

    if (service.isDelete) {
      throw new BadRequestException('Ce service est déjà supprimé.');
    }

    const deletedService = await this.prismaService.service.update({
      where: { id },
      data: { isDelete: true },
    });

    return this.responseFormatter.success(
      { id: deletedService.id },
      'Suppression logique',
      'Service supprimé logiquement avec succès.',
    );
  }

  // 🗑️ Suppression définitive (hard delete)
  async hardDelete(id: number) {
    const service = await this.prismaService.service.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service non trouvé.');
    }

    await this.prismaService.$transaction(async (tx) => {
      // Dissocier les enfants
      if (service.children.length > 0) {
        await tx.service.updateMany({
          where: { parentId: id },
          data: { parentId: null },
        });
      }

      // Supprimer définitivement le service
      await tx.service.delete({
        where: { id },
      });
    });

    return this.responseFormatter.success(
      { id },
      'Suppression définitive',
      'Service supprimé définitivement avec succès.',
    );
  }

  // 👶 Récupérer tous les enfants d'un service
  async getServiceChildren(id: number) {
    // Vérifier si le service parent existe
    const parentService = await this.prismaService.service.findUnique({
      where: { id },
    });

    if (!parentService) {
      throw new NotFoundException('Service parent non trouvé.');
    }

    // Récupérer tous les enfants du service
    const children = await this.prismaService.service.findMany({
      where: {
        parentId: id,
        isDelete: false,
      },
      orderBy: { nom: 'asc' },
      select: {
        id: true,
        nom: true,
        sigle: true,
        type: true,
        parentId: true,
        isActive: true,
        isDelete: true,
        isVisible: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.responseFormatter.success(
      {
        parentServiceId: parentService.id,
        parentServiceName: parentService.nom,
        children,
        totalChildren: children.length,
      },
      'Liste des enfants du service',
      `${children.length} enfant(s) récupéré(s) avec succès.`,
    );
  }
}
