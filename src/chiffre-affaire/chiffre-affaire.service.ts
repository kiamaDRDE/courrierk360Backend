import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChiffreAffaireDto } from './dto/create-chiffre-affaire.dto';
import { UpdateChiffreAffaireDto } from './dto/update-chiffre-affaire.dto';
import { ChiffreAffaireResponseDto } from './dto/chiffre-affaire-response.dto';
import { ChiffreAffaireQueryDto } from './dto/chiffre-affaire-query.dto';
import { PaginatedChiffreAffaireResponseDto, PaginationMetaDto } from './dto/paginated-chiffre-affaire-response.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ChiffreAffaireService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createChiffreAffaireDto: CreateChiffreAffaireDto): Promise<ChiffreAffaireResponseDto> {
    const { services, ...chiffreAffaireData } = createChiffreAffaireDto;

    // Vérifier que l'opérateur existe
    const operateur = await this.prisma.operateur.findUnique({
      where: { id: createChiffreAffaireDto.operateurId }
    });

    if (!operateur) {
      throw new NotFoundException(`Opérateur avec l'ID ${createChiffreAffaireDto.operateurId} non trouvé`);
    }

    // Vérifier qu'il n'existe pas déjà un chiffre d'affaire pour cet opérateur cette année
    const existingChiffreAffaire = await this.prisma.chiffreAffaire.findUnique({
      where: {
        unique_operateur_annee: {
          operateurId: createChiffreAffaireDto.operateurId,
          annee: createChiffreAffaireDto.annee
        }
      }
    });

    if (existingChiffreAffaire) {
      throw new ConflictException(`Un chiffre d'affaire existe déjà pour l'opérateur ${operateur.nom} en ${createChiffreAffaireDto.annee}`);
    }

    // Vérifier que tous les services existent
    if (services?.length > 0) {
      const existingServices = await this.prisma.service.findMany({
        where: { id: { in: services } }
      });

      if (existingServices.length !== services.length) {
        const existingIds = existingServices.map(s => s.id);
        const missingIds = services.filter(id => !existingIds.includes(id));
        throw new BadRequestException(`Services non trouvés: ${missingIds.join(', ')}`);
      }
    }

    // Créer le chiffre d'affaire avec ses relations
    const chiffreAffaire = await this.prisma.chiffreAffaire.create({
      data: {
        ...chiffreAffaireData,
        chiffreAffaire: new Decimal(chiffreAffaireData.chiffreAffaire),
        services: {
          create: services?.map(serviceId => ({
            serviceId: serviceId
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

    return this.mapToResponseDto(chiffreAffaire);
  }

  async findAll(): Promise<ChiffreAffaireResponseDto[]> {
    const chiffresAffaire = await this.prisma.chiffreAffaire.findMany({
      include: {
        operateur: true,
        services: {
          include: {
            service: true
          }
        }
      },
      orderBy: [
        { annee: 'desc' },
        { chiffreAffaire: 'desc' }
      ]
    });

    return chiffresAffaire.map(chiffreAffaire => this.mapToResponseDto(chiffreAffaire));
  }

  async findAllPaginated(query: ChiffreAffaireQueryDto): Promise<PaginatedChiffreAffaireResponseDto> {
    const { 
      page = 1, 
      limit = 10, 
      operateurId, 
      annee, 
      operateurNom, 
      serviceId, 
      chiffreAffaireMin,
      chiffreAffaireMax,
      sortBy = 'annee',
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

    if (chiffreAffaireMin !== undefined || chiffreAffaireMax !== undefined) {
      where.chiffreAffaire = {};
      if (chiffreAffaireMin !== undefined) {
        where.chiffreAffaire.gte = new Decimal(chiffreAffaireMin);
      }
      if (chiffreAffaireMax !== undefined) {
        where.chiffreAffaire.lte = new Decimal(chiffreAffaireMax);
      }
    }

    // Construire l'ordre de tri
    const orderBy: any = {};
    if (sortBy === 'operateurId' || sortBy === 'annee' || sortBy === 'chiffreAffaire' || sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'id') {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.annee = 'desc';
    }

    // Si page = 0, récupérer tous les résultats
    if (page === 0) {
      const chiffresAffaire = await this.prisma.chiffreAffaire.findMany({
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

      const totalItems = chiffresAffaire.length;

      return {
        data: chiffresAffaire.map(chiffreAffaire => this.mapToResponseDto(chiffreAffaire)),
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

    const [chiffresAffaire, totalItems] = await Promise.all([
      this.prisma.chiffreAffaire.findMany({
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
      this.prisma.chiffreAffaire.count({ where })
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
      data: chiffresAffaire.map(chiffreAffaire => this.mapToResponseDto(chiffreAffaire)),
      meta
    };
  }

  async findOne(id: number): Promise<ChiffreAffaireResponseDto> {
    const chiffreAffaire = await this.prisma.chiffreAffaire.findUnique({
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

    if (!chiffreAffaire) {
      throw new NotFoundException(`Chiffre d'affaire avec l'ID ${id} non trouvé`);
    }

    return this.mapToResponseDto(chiffreAffaire);
  }

  async findByOperateur(operateurId: number): Promise<ChiffreAffaireResponseDto[]> {
    const chiffresAffaire = await this.prisma.chiffreAffaire.findMany({
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
        annee: 'desc'
      }
    });

    return chiffresAffaire.map(chiffreAffaire => this.mapToResponseDto(chiffreAffaire));
  }

  async findByYear(annee: number): Promise<ChiffreAffaireResponseDto[]> {
    const chiffresAffaire = await this.prisma.chiffreAffaire.findMany({
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
        chiffreAffaire: 'desc'
      }
    });

    return chiffresAffaire.map(chiffreAffaire => this.mapToResponseDto(chiffreAffaire));
  }

  async findByOperateurAndYear(operateurId: number, annee: number): Promise<ChiffreAffaireResponseDto | null> {
    const chiffreAffaire = await this.prisma.chiffreAffaire.findUnique({
      where: {
        unique_operateur_annee: {
          operateurId,
          annee
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

    return chiffreAffaire ? this.mapToResponseDto(chiffreAffaire) : null;
  }

  async update(id: number, updateChiffreAffaireDto: UpdateChiffreAffaireDto): Promise<ChiffreAffaireResponseDto> {
    const { services, ...chiffreAffaireData } = updateChiffreAffaireDto;

    // Vérifier que le chiffre d'affaire existe
    const existingChiffreAffaire = await this.prisma.chiffreAffaire.findUnique({
      where: { id }
    });

    if (!existingChiffreAffaire) {
      throw new NotFoundException(`Chiffre d'affaire avec l'ID ${id} non trouvé`);
    }

    // Vérifier l'opérateur si fourni
    if (updateChiffreAffaireDto.operateurId) {
      const operateur = await this.prisma.operateur.findUnique({
        where: { id: updateChiffreAffaireDto.operateurId }
      });

      if (!operateur) {
        throw new NotFoundException(`Opérateur avec l'ID ${updateChiffreAffaireDto.operateurId} non trouvé`);
      }
    }

    // Vérifier l'unicité opérateur-année si l'un d'eux change
    if (updateChiffreAffaireDto.operateurId || updateChiffreAffaireDto.annee) {
      const newOperateurId = updateChiffreAffaireDto.operateurId || existingChiffreAffaire.operateurId;
      const newAnnee = updateChiffreAffaireDto.annee || existingChiffreAffaire.annee;

      const conflictingChiffreAffaire = await this.prisma.chiffreAffaire.findUnique({
        where: {
          unique_operateur_annee: {
            operateurId: newOperateurId,
            annee: newAnnee
          }
        }
      });

      if (conflictingChiffreAffaire && conflictingChiffreAffaire.id !== id) {
        throw new ConflictException(`Un chiffre d'affaire existe déjà pour cet opérateur en ${newAnnee}`);
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      ...chiffreAffaireData,
    };

    if (chiffreAffaireData.chiffreAffaire) {
      updateData.chiffreAffaire = new Decimal(chiffreAffaireData.chiffreAffaire);
    }

    // Mettre à jour les services si fournis
    if (services !== undefined) {
      if (services?.length > 0) {
        const existingServices = await this.prisma.service.findMany({
          where: { id: { in: services } }
        });

        if (existingServices.length !== services.length) {
          const existingIds = existingServices.map(s => s.id);
          const missingIds = services.filter(id => !existingIds.includes(id));
          throw new BadRequestException(`Services non trouvés: ${missingIds.join(', ')}`);
        }
      }

      updateData.services = {
        deleteMany: {},
        create: services?.map(serviceId => ({
          serviceId: serviceId
        })) || []
      };
    }

    const chiffreAffaire = await this.prisma.chiffreAffaire.update({
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

    return this.mapToResponseDto(chiffreAffaire);
  }

  async remove(id: number): Promise<{ message: string; deletedId: number }> {
    const chiffreAffaire = await this.prisma.chiffreAffaire.findUnique({
      where: { id }
    });

    if (!chiffreAffaire) {
      throw new NotFoundException(`Chiffre d'affaire avec l'ID ${id} non trouvé`);
    }

    // Supprimer d'abord les relations
    await this.prisma.chiffreAffaireService.deleteMany({
      where: { chiffreAffaireId: id }
    });

    // Supprimer le chiffre d'affaire
    await this.prisma.chiffreAffaire.delete({
      where: { id }
    });

    return {
      message: 'Chiffre d\'affaire supprimé avec succès',
      deletedId: id
    };
  }

  private mapToResponseDto(chiffreAffaire: any): ChiffreAffaireResponseDto {
    return {
      id: chiffreAffaire.id,
      operateurId: chiffreAffaire.operateurId,
      operateurName: chiffreAffaire.operateur?.nom,
      annee: chiffreAffaire.annee,
      chiffreAffaire: chiffreAffaire.chiffreAffaire.toString(),
      description: chiffreAffaire.description,
      createdAt: chiffreAffaire.createdAt,
      updatedAt: chiffreAffaire.updatedAt,
      services: chiffreAffaire.services?.map((cas: any) => ({
        id: cas.id,
        serviceId: cas.serviceId,
        serviceName: cas.service?.nom
      })) || []
    };
  }
}
