import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaracteristiqueDto } from './dto/create-caracteristique.dto';
import { UpdateCaracteristiqueDto } from './dto/update-caracteristique.dto';
import { QueryCaracteristiqueDto } from './dto/query-caracteristique.dto';
import { ResponseApi } from '../../common/responseApi.dto';

@Injectable()
export class CaracteristiqueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCaracteristiqueDto: CreateCaracteristiqueDto): Promise<ResponseApi<any>> {
    try {
      // Vérifier que l'offre existe
      const offre = await this.prisma.offre.findUnique({
        where: { id: createCaracteristiqueDto.offreId }
      });

      if (!offre) {
        throw new NotFoundException(`Offre avec l'ID ${createCaracteristiqueDto.offreId} non trouvée`);
      }

      // Vérifier qu'il n'existe pas déjà une caractéristique de ce type pour cette offre
      const existingCaracteristique = await this.prisma.caracteristique.findUnique({
        where: { 
          unique_caracteristique_offre_type: {
            offreId: createCaracteristiqueDto.offreId,
            type: createCaracteristiqueDto.type
          }
        }
      });

      if (existingCaracteristique) {
        throw new ConflictException(`Une caractéristique de type "${createCaracteristiqueDto.type}" existe déjà pour cette offre`);
      }

      // Créer la caractéristique
      const caracteristique = await this.prisma.caracteristique.create({
        data: createCaracteristiqueDto,
        include: {
          offre: {
            include: {
              operateur: true
            }
          }
        }
      });

      return new ResponseApi(
        true,
        201,
        'CARACTERISTIQUE_CREATED',
        'Succès',
        'Caractéristique créée avec succès',
        caracteristique
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la création de la caractéristique');
    }
  }

  async findAll(query: QueryCaracteristiqueDto): Promise<ResponseApi<any>> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        nomOffre,
        operateurId,
        typeOffre,
        typeCaracteristique
      } = query;

      const offset = (page - 1) * limit;

      // Construction du filtre WHERE
      const where: any = {};

      if (typeCaracteristique) {
        where.type = {
          contains: typeCaracteristique
        };
      }

      if (nomOffre || operateurId || typeOffre) {
        where.offre = {};
        
        if (nomOffre) {
          where.offre.nom = {
            contains: nomOffre
          };
        }

        if (typeOffre) {
          where.offre.typeOffre = {
            contains: typeOffre
          };
        }

        if (operateurId) {
          where.offre.operateurId = operateurId;
        }
      }

      // Validation et sécurisation du sortBy
      const allowedSortFields = ['onNet', 'offNet', 'international', 'roaming', 'type', 'createdAt', 'updatedAt', 'id'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

      // Récupération des données avec pagination
      const [caracteristiques, total] = await Promise.all([
        this.prisma.caracteristique.findMany({
          where,
          include: {
            offre: {
              include: {
                operateur: true
              }
            }
          },
          orderBy: {
            [validSortBy]: validSortOrder
          },
          skip: offset,
          take: limit
        }),
        this.prisma.caracteristique.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      const responseData = {
        items: caracteristiques,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

      return new ResponseApi(
        true,
        200,
        'CARACTERISTIQUES_RETRIEVED',
        'Succès',
        'Caractéristiques récupérées avec succès',
        responseData
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des caractéristiques:', error);
      throw new BadRequestException(`Erreur lors de la récupération des caractéristiques: ${error.message}`);
    }
  }

  async findOne(id: number): Promise<ResponseApi<any>> {
    try {
      const caracteristique = await this.prisma.caracteristique.findUnique({
        where: { id },
        include: {
          offre: {
            include: {
              operateur: true
            }
          }
        }
      });

      if (!caracteristique) {
        throw new NotFoundException(`Caractéristique avec l'ID ${id} non trouvée`);
      }

      return new ResponseApi(
        true,
        200,
        'CARACTERISTIQUE_RETRIEVED',
        'Succès',
        'Caractéristique récupérée avec succès',
        caracteristique
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la récupération de la caractéristique');
    }
  }

  async findByOffre(offreId: number): Promise<ResponseApi<any>> {
    try {
      // Vérifier que l'offre existe
      const offre = await this.prisma.offre.findUnique({
        where: { id: offreId }
      });

      if (!offre) {
        throw new NotFoundException(`Offre avec l'ID ${offreId} non trouvée`);
      }

      const caracteristiques = await this.prisma.caracteristique.findMany({
        where: { offreId },
        include: {
          offre: {
            include: {
              operateur: true
            }
          }
        },
        orderBy: {
          type: 'asc'
        }
      });

      return new ResponseApi(
        true,
        200,
        'CARACTERISTIQUES_BY_OFFRE_RETRIEVED',
        'Succès',
        'Caractéristiques récupérées avec succès',
        caracteristiques
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la récupération des caractéristiques');
    }
  }

  async findByOffreAndType(offreId: number, type: string): Promise<ResponseApi<any>> {
    try {
      // Vérifier que l'offre existe
      const offre = await this.prisma.offre.findUnique({
        where: { id: offreId }
      });

      if (!offre) {
        throw new NotFoundException(`Offre avec l'ID ${offreId} non trouvée`);
      }

      const caracteristique = await this.prisma.caracteristique.findUnique({
        where: { 
          unique_caracteristique_offre_type: {
            offreId,
            type
          }
        },
        include: {
          offre: {
            include: {
              operateur: true
            }
          }
        }
      });

      if (!caracteristique) {
        throw new NotFoundException(`Caractéristique de type "${type}" pour l'offre ${offreId} non trouvée`);
      }

      return new ResponseApi(
        true,
        200,
        'CARACTERISTIQUE_BY_OFFRE_TYPE_RETRIEVED',
        'Succès',
        'Caractéristique récupérée avec succès',
        caracteristique
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la récupération de la caractéristique');
    }
  }

  async update(id: number, updateCaracteristiqueDto: UpdateCaracteristiqueDto): Promise<ResponseApi<any>> {
    try {
      // Vérifier que la caractéristique existe
      const existingCaracteristique = await this.prisma.caracteristique.findUnique({
        where: { id }
      });

      if (!existingCaracteristique) {
        throw new NotFoundException(`Caractéristique avec l'ID ${id} non trouvée`);
      }

      // Si offreId est fourni, vérifier que l'offre existe
      if (updateCaracteristiqueDto.offreId) {
        const offre = await this.prisma.offre.findUnique({
          where: { id: updateCaracteristiqueDto.offreId }
        });

        if (!offre) {
          throw new NotFoundException(`Offre avec l'ID ${updateCaracteristiqueDto.offreId} non trouvée`);
        }
      }

      // Si on change l'offre ou le type, vérifier les conflits
      if (updateCaracteristiqueDto.offreId || updateCaracteristiqueDto.type) {
        const newOffreId = updateCaracteristiqueDto.offreId || existingCaracteristique.offreId;
        const newType = updateCaracteristiqueDto.type || existingCaracteristique.type;

        // Vérifier seulement si on change réellement l'offre ou le type
        if (newOffreId !== existingCaracteristique.offreId || newType !== existingCaracteristique.type) {
          const existingForOffreType = await this.prisma.caracteristique.findUnique({
            where: { 
              unique_caracteristique_offre_type: {
                offreId: newOffreId,
                type: newType
              }
            }
          });

          if (existingForOffreType) {
            throw new ConflictException(`Une caractéristique de type "${newType}" existe déjà pour cette offre`);
          }
        }
      }

      // Mettre à jour la caractéristique
      const caracteristique = await this.prisma.caracteristique.update({
        where: { id },
        data: updateCaracteristiqueDto,
        include: {
          offre: {
            include: {
              operateur: true
            }
          }
        }
      });

      return new ResponseApi(
        true,
        200,
        'CARACTERISTIQUE_UPDATED',
        'Succès',
        'Caractéristique mise à jour avec succès',
        caracteristique
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la mise à jour de la caractéristique');
    }
  }

  async remove(id: number): Promise<ResponseApi<any>> {
    try {
      // Vérifier que la caractéristique existe
      const existingCaracteristique = await this.prisma.caracteristique.findUnique({
        where: { id },
        include: {
          offre: {
            include: {
              operateur: true
            }
          }
        }
      });

      if (!existingCaracteristique) {
        throw new NotFoundException(`Caractéristique avec l'ID ${id} non trouvée`);
      }

      // Supprimer la caractéristique
      await this.prisma.caracteristique.delete({
        where: { id }
      });

      return new ResponseApi(
        true,
        200,
        'CARACTERISTIQUE_DELETED',
        'Succès',
        'Caractéristique supprimée avec succès',
        existingCaracteristique
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la suppression de la caractéristique');
    }
  }

  async getStatistics(): Promise<ResponseApi<any>> {
    try {
      // Calculer les statistiques globales
      const [
        totalRecords,
        statsByType,
        averageOnNet,
        averageOffNet,
        averageInternational,
        averageRoaming,
        maxOnNet,
        minOnNet
      ] = await Promise.all([
        this.prisma.caracteristique.count(),
        this.prisma.caracteristique.groupBy({
          by: ['type'],
          _count: {
            id: true
          }
        }),
        this.prisma.caracteristique.aggregate({
          _avg: { onNet: true }
        }),
        this.prisma.caracteristique.aggregate({
          _avg: { offNet: true }
        }),
        this.prisma.caracteristique.aggregate({
          _avg: { international: true }
        }),
        this.prisma.caracteristique.aggregate({
          _avg: { roaming: true }
        }),
        this.prisma.caracteristique.aggregate({
          _max: { onNet: true }
        }),
        this.prisma.caracteristique.aggregate({
          _min: { onNet: true }
        })
      ]);

      const statistics = {
        totalRecords,
        repartitionParType: statsByType.reduce((acc, stat) => {
          acc[stat.type] = stat._count.id;
          return acc;
        }, {}),
        moyennes: {
          onNet: averageOnNet._avg.onNet || 0,
          offNet: averageOffNet._avg.offNet || 0,
          international: averageInternational._avg.international || 0,
          roaming: averageRoaming._avg.roaming || 0
        },
        extremes: {
          maxOnNet: maxOnNet._max.onNet || 0,
          minOnNet: minOnNet._min.onNet || 0
        }
      };

      return new ResponseApi(
        true,
        200,
        'STATISTICS_RETRIEVED',
        'Succès',
        'Statistiques récupérées avec succès',
        statistics
      );
    } catch (error) {
      throw new BadRequestException('Erreur lors de la récupération des statistiques');
    }
  }
}
