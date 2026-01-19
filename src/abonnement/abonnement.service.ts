import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAbonnementDto } from './dto/create-abonnement.dto';
import { UpdateAbonnementDto } from './dto/update-abonnement.dto';
import { AbonnementResponseDto } from './dto/abonnement-response.dto';
import { AbonnementQueryDto } from './dto/abonnement-query.dto';
import { PaginatedAbonnementResponseDto, PaginationMetaDto } from './dto/paginated-abonnement-response.dto';

@Injectable()
export class AbonnementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAbonnementDto: CreateAbonnementDto): Promise<AbonnementResponseDto> {
    const { services, ...abonnementData } = createAbonnementDto;

    // Vérifier que l'opérateur existe
    const operateur = await this.prisma.operateur.findUnique({
      where: { id: createAbonnementDto.operateurId }
    });

    if (!operateur) {
      throw new NotFoundException(`Opérateur avec l'ID ${createAbonnementDto.operateurId} non trouvé`);
    }

    // Vérifier que tous les services existent
    if (services?.length > 0) {
      const serviceIds = services.map(s => s.serviceId);
      const existingServices = await this.prisma.service.findMany({
        where: { id: { in: serviceIds } }
      });

      if (existingServices.length !== serviceIds.length) {
        const existingIds = existingServices.map(s => s.id);
        const missingIds = serviceIds.filter(id => !existingIds.includes(id));
        throw new BadRequestException(`Services non trouvés: ${missingIds.join(', ')}`);
      }
    }

    // Créer l'abonnement avec ses relations
    const abonnement = await this.prisma.abonnement.create({
      data: {
        ...abonnementData,
        services: {
          create: services?.map(service => ({
            serviceId: service.serviceId
          })) || []
        }
      },
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        }
      }
    });

    return this.mapToResponseDto(abonnement);
  }

  async findAll(): Promise<AbonnementResponseDto[]> {
    const abonnements = await this.prisma.abonnement.findMany({
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return abonnements.map(abonnement => this.mapToResponseDto(abonnement));
  }

  async findAllPaginated(query: AbonnementQueryDto): Promise<PaginatedAbonnementResponseDto> {
    const { 
      page = 1, 
      limit = 10, 
      operateurId, 
      annee, 
      typeAbonnement, 
      operateurNom, 
      serviceId, 
      nombreAbonnesMin,
      nombreAbonnesMax,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;

    // Construire les conditions de filtre
    const where: any = {};

    if (operateurId) {
      where.operateurId = operateurId;
    }

    if (annee) {
      where.annee = annee;
    }

    if (typeAbonnement) {
      where.typeAbonnement = {
        contains: typeAbonnement,
        mode: 'insensitive'
      };
    }

    if (operateurNom) {
      where.operateur = {
        nom: {
          contains: operateurNom,
          mode: 'insensitive'
        }
      };
    }

    if (serviceId) {
      where.services = {
        some: {
          serviceId: serviceId
        }
      };
    }

    if (nombreAbonnesMin !== undefined || nombreAbonnesMax !== undefined) {
      where.nombreAbonnes = {};
      if (nombreAbonnesMin !== undefined) {
        where.nombreAbonnes.gte = nombreAbonnesMin;
      }
      if (nombreAbonnesMax !== undefined) {
        where.nombreAbonnes.lte = nombreAbonnesMax;
      }
    }

    // Construire l'ordre de tri
    const orderBy: any = {};
    if (sortBy === 'operateurId' || sortBy === 'annee' || sortBy === 'typeAbonnement' || sortBy === 'nombreAbonnes' || sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'id') {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Si page = 0, récupérer tous les résultats
    if (page === 0) {
      const abonnements = await this.prisma.abonnement.findMany({
        where,
        include: {
          operateur: true,
          services: {
            include: {
              service: true
            }
          }
        },
        orderBy
      });

      const totalItems = abonnements.length;

      return {
        data: abonnements.map(abonnement => this.mapToResponseDto(abonnement)),
        meta: {
          currentPage: 0,
          itemsPerPage: totalItems,
          totalItems,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false
        }
      };
    }

    // Pagination normale
    const skip = (page - 1) * limit;

    const [abonnements, totalItems] = await Promise.all([
      this.prisma.abonnement.findMany({
        where,
        include: {
          operateur: true,
          services: {
            include: {
              service: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.abonnement.count({ where })
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const meta: PaginationMetaDto = {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages
    };

    return {
      data: abonnements.map(abonnement => this.mapToResponseDto(abonnement)),
      meta
    };
  }

  async findOne(id: number): Promise<AbonnementResponseDto> {
    const abonnement = await this.prisma.abonnement.findUnique({
      where: { id },
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (!abonnement) {
      throw new NotFoundException(`Abonnement avec l'ID ${id} non trouvé`);
    }

    return this.mapToResponseDto(abonnement);
  }

  async findByOperateur(operateurId: number): Promise<AbonnementResponseDto[]> {
    const abonnements = await this.prisma.abonnement.findMany({
      where: { operateurId },
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return abonnements.map(abonnement => this.mapToResponseDto(abonnement));
  }

  async findByYear(annee: number): Promise<AbonnementResponseDto[]> {
    const abonnements = await this.prisma.abonnement.findMany({
      where: { annee },
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return abonnements.map(abonnement => this.mapToResponseDto(abonnement));
  }

  async update(id: number, updateAbonnementDto: UpdateAbonnementDto): Promise<AbonnementResponseDto> {
    const { services, ...abonnementData } = updateAbonnementDto;

    // Vérifier que l'abonnement existe
    const existingAbonnement = await this.prisma.abonnement.findUnique({
      where: { id }
    });

    if (!existingAbonnement) {
      throw new NotFoundException(`Abonnement avec l'ID ${id} non trouvé`);
    }

    // Vérifier l'opérateur si fourni
    if (updateAbonnementDto.operateurId) {
      const operateur = await this.prisma.operateur.findUnique({
        where: { id: updateAbonnementDto.operateurId }
      });

      if (!operateur) {
        throw new NotFoundException(`Opérateur avec l'ID ${updateAbonnementDto.operateurId} non trouvé`);
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      ...abonnementData,
    };

    // Mettre à jour les services si fournis
    if (services !== undefined) {
      if (services?.length > 0) {
        const serviceIds = services.map(s => s.serviceId);
        const existingServices = await this.prisma.service.findMany({
          where: { id: { in: serviceIds } }
        });

        if (existingServices.length !== serviceIds.length) {
          const existingIds = existingServices.map(s => s.id);
          const missingIds = serviceIds.filter(id => !existingIds.includes(id));
          throw new BadRequestException(`Services non trouvés: ${missingIds.join(', ')}`);
        }
      }

      updateData.services = {
        deleteMany: {},
        create: services?.map(service => ({
          serviceId: service.serviceId
        })) || []
      };
    }

    const abonnement = await this.prisma.abonnement.update({
      where: { id },
      data: updateData,
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        }
      }
    });

    return this.mapToResponseDto(abonnement);
  }

  async remove(id: number): Promise<{ message: string; deletedId: number }> {
    const abonnement = await this.prisma.abonnement.findUnique({
      where: { id }
    });

    if (!abonnement) {
      throw new NotFoundException(`Abonnement avec l'ID ${id} non trouvé`);
    }

    // Supprimer d'abord les relations
    await this.prisma.abonnementService.deleteMany({
      where: { abonnementId: id }
    });

    // Supprimer l'abonnement
    await this.prisma.abonnement.delete({
      where: { id }
    });

    return {
      message: 'Abonnement supprimé avec succès',
      deletedId: id
    };
  }

  private mapToResponseDto(abonnement: any): AbonnementResponseDto {
    return {
      id: abonnement.id,
      operateurId: abonnement.operateurId,
      operateurName: abonnement.operateur?.nom,
      annee: abonnement.annee,
      typeAbonnement: abonnement.typeAbonnement,
      nombreAbonnes: abonnement.nombreAbonnes,
      description: abonnement.description,
      createdAt: abonnement.createdAt,
      updatedAt: abonnement.updatedAt,
      services: abonnement.services?.map((as: any) => ({
        id: as.id,
        serviceId: as.serviceId,
        serviceName: as.service?.nom
      })) || []
    };
  }
}
