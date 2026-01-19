import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTraficDto } from './dto/create-trafic.dto';
import { UpdateTraficDto } from './dto/update-trafic.dto';
import { TraficResponseDto } from './dto/trafic-response.dto';
import { TraficQueryDto } from './dto/trafic-query.dto';
import { PaginatedTraficResponseDto, PaginationMetaDto } from './dto/paginated-trafic-response.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TraficService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTraficDto: CreateTraficDto): Promise<TraficResponseDto> {
    const { services, autresOperateurs, ...traficData } = createTraficDto;

    // Vérifier que l'opérateur existe
    const operateur = await this.prisma.operateur.findUnique({
      where: { id: createTraficDto.operateurId }
    });

    if (!operateur) {
      throw new NotFoundException(`Opérateur avec l'ID ${createTraficDto.operateurId} non trouvé`);
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

    // Vérifier que tous les autres opérateurs existent
    if (autresOperateurs && autresOperateurs.length > 0) {
      const operateurIds = autresOperateurs.map(o => o.autreOperateurId);
      const existingOperateurs = await this.prisma.operateur.findMany({
        where: { id: { in: operateurIds } }
      });

      if (existingOperateurs.length !== operateurIds.length) {
        const existingIds = existingOperateurs.map(o => o.id);
        const missingIds = operateurIds.filter(id => !existingIds.includes(id));
        throw new BadRequestException(`Opérateurs non trouvés: ${missingIds.join(', ')}`);
      }
    }

    // Créer le trafic avec ses relations (exclure description qui n'existe pas dans le schéma)
    const trafic = await this.prisma.trafic.create({
      data: {
        ...traficData,
        volume: new Decimal(traficData.volume),
        services: {
          create: services?.map(service => ({
            serviceId: service.serviceId
          })) || []
        },
        autresOperateurs: {
          create: autresOperateurs?.map(operateur => ({
            autreOperateurId: operateur.autreOperateurId
          })) || []
        }
      },
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        },
        autresOperateurs: {
          include: {
            autreOperateurRef: true
          }
        }
      }
    });

    return this.mapToResponseDto(trafic);
  }

  async findAll(): Promise<TraficResponseDto[]> {
    const trafics = await this.prisma.trafic.findMany({
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        },
        autresOperateurs: {
          include: {
            autreOperateurRef: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return trafics.map(trafic => this.mapToResponseDto(trafic));
  }

  async findAllPaginated(query: TraficQueryDto): Promise<PaginatedTraficResponseDto> {
    const { 
      page = 1, 
      limit = 10, 
      operateurId, 
      annee, 
      typeTrafic, 
      operateurNom, 
      serviceId, 
      autreOperateurId,
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

    if (typeTrafic) {
      where.typeTrafic = {
        contains: typeTrafic,
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

    if (autreOperateurId) {
      where.autresOperateurs = {
        some: {
          autreOperateurId: autreOperateurId
        }
      };
    }

    // Construire l'ordre de tri
    const orderBy: any = {};
    if (sortBy === 'operateurId' || sortBy === 'annee' || sortBy === 'typeTrafic' || sortBy === 'volume' || sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'id') {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Si page = 0, récupérer tous les résultats
    if (page === 0) {
      const trafics = await this.prisma.trafic.findMany({
        where,
        include: {
          operateur: true,
          services: {
            include: {
              service: true
            }
          },
          autresOperateurs: {
            include: {
              autreOperateurRef: true
            }
          }
        },
        orderBy
      });

      const totalItems = trafics.length;

      return {
        data: trafics.map(trafic => this.mapToResponseDto(trafic)),
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

    const [trafics, totalItems] = await Promise.all([
      this.prisma.trafic.findMany({
        where,
        include: {
          operateur: true,
          services: {
            include: {
              service: true
            }
          },
          autresOperateurs: {
            include: {
              autreOperateurRef: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.trafic.count({ where })
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
      data: trafics.map(trafic => this.mapToResponseDto(trafic)),
      meta
    };
  }

  async findOne(id: number): Promise<TraficResponseDto> {
    const trafic = await this.prisma.trafic.findUnique({
      where: { id },
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        },
        autresOperateurs: {
          include: {
            autreOperateurRef: true
          }
        }
      }
    });

    if (!trafic) {
      throw new NotFoundException(`Trafic avec l'ID ${id} non trouvé`);
    }

    return this.mapToResponseDto(trafic);
  }

  async findByOperateur(operateurId: number): Promise<TraficResponseDto[]> {
    const trafics = await this.prisma.trafic.findMany({
      where: { operateurId },
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        },
        autresOperateurs: {
          include: {
            autreOperateurRef: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return trafics.map(trafic => this.mapToResponseDto(trafic));
  }

  async findByYear(annee: number): Promise<TraficResponseDto[]> {
    const trafics = await this.prisma.trafic.findMany({
      where: { annee },
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        },
        autresOperateurs: {
          include: {
            autreOperateurRef: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return trafics.map(trafic => this.mapToResponseDto(trafic));
  }

  async update(id: number, updateTraficDto: UpdateTraficDto): Promise<TraficResponseDto> {
    const { services, autresOperateurs, ...traficData } = updateTraficDto;

    // Vérifier que le trafic existe
    const existingTrafic = await this.prisma.trafic.findUnique({
      where: { id }
    });

    if (!existingTrafic) {
      throw new NotFoundException(`Trafic avec l'ID ${id} non trouvé`);
    }

    // Vérifier l'opérateur si fourni
    if (updateTraficDto.operateurId) {
      const operateur = await this.prisma.operateur.findUnique({
        where: { id: updateTraficDto.operateurId }
      });

      if (!operateur) {
        throw new NotFoundException(`Opérateur avec l'ID ${updateTraficDto.operateurId} non trouvé`);
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      ...traficData,
    };

    if (traficData.volume) {
      updateData.volume = new Decimal(traficData.volume);
    }

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

    // Mettre à jour les autres opérateurs si fournis
    if (autresOperateurs !== undefined) {
      if (autresOperateurs?.length > 0) {
        const operateurIds = autresOperateurs.map(o => o.autreOperateurId);
        const existingOperateurs = await this.prisma.operateur.findMany({
          where: { id: { in: operateurIds } }
        });

        if (existingOperateurs.length !== operateurIds.length) {
          const existingIds = existingOperateurs.map(o => o.id);
          const missingIds = operateurIds.filter(id => !existingIds.includes(id));
          throw new BadRequestException(`Opérateurs non trouvés: ${missingIds.join(', ')}`);
        }
      }

      updateData.autresOperateurs = {
        deleteMany: {},
        create: autresOperateurs?.map(operateur => ({
          autreOperateurId: operateur.autreOperateurId
        })) || []
      };
    }

    const trafic = await this.prisma.trafic.update({
      where: { id },
      data: updateData,
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        },
        autresOperateurs: {
          include: {
            autreOperateurRef: true
          }
        }
      }
    });

    return this.mapToResponseDto(trafic);
  }

  async remove(id: number): Promise<{ message: string }> {
    const trafic = await this.prisma.trafic.findUnique({
      where: { id }
    });

    if (!trafic) {
      throw new NotFoundException(`Trafic avec l'ID ${id} non trouvé`);
    }

    // Supprimer d'abord les relations
    await this.prisma.traficService.deleteMany({
      where: { traficId: id }
    });

    await this.prisma.traficAutreOperateur.deleteMany({
      where: { traficId: id }
    });

    // Supprimer le trafic
    await this.prisma.trafic.delete({
      where: { id }
    });

    return { message: `Trafic avec l'ID ${id} supprimé avec succès` };
  }

  private mapToResponseDto(trafic: any): TraficResponseDto {
    return {
      id: trafic.id,
      operateurId: trafic.operateurId,
      operateurName: trafic.operateur?.nom,
      annee: trafic.annee,
      typeTrafic: trafic.typeTrafic,
      volume: trafic.volume.toString(),
      description: trafic.description,
      createdAt: trafic.createdAt,
      updatedAt: trafic.updatedAt,
      services: trafic.services?.map((ts: any) => ({
        id: ts.id,
        serviceId: ts.serviceId,
        serviceName: ts.service?.nom
      })) || [],
      autresOperateurs: trafic.autresOperateurs?.map((tao: any) => ({
        id: tao.id,
        autreOperateurId: tao.autreOperateurId,
        autreOperateurName: tao.autreOperateurRef?.nom
      })) || []
    };
  }
}
