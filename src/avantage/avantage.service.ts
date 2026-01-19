import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvantageDto } from './dto/create-avantage.dto';
import { UpdateAvantageDto } from './dto/update-avantage.dto';
import { QueryAvantageDto } from './dto/query-avantage.dto';
import { UpdateMultipleAvantageDto, UpdateAvantageItemDto } from './dto/update-multiple-avantage.dto';

@Injectable()
export class AvantageService {
  constructor(private prisma: PrismaService) {}

  private formatResponse(data: any, title: string, message: string) {
    return {
      success: true,
      statusCode: 201,
      code: 'success',
      title,
      message,
      data,
    };
  }

  async create(createAvantageDto: CreateAvantageDto) {
    const { offreId, avantages } = createAvantageDto;

    // Vérifier si l'offre existe si offreId est fourni
    if (offreId) {
      const existingOffre = await this.prisma.offre.findUnique({
        where: { id: offreId },
        select: { id: true, nom: true },
      });

      if (!existingOffre) {
        throw new BadRequestException(
          `L'offre avec l'ID ${offreId} n'existe pas`,
        );
      }
    }

    // Vérifier si des avantages avec les mêmes noms existent déjà
    const existingAvantages = await this.prisma.avantage.findMany({
      where: {
        nom: { in: avantages.map(a => a.nom) },
      },
      select: { nom: true },
    });

    if (existingAvantages.length > 0) {
      const conflictingNames = existingAvantages.map(a => a.nom);
      throw new ConflictException(
        `Des avantages avec les noms suivants existent déjà : ${conflictingNames.join(', ')}`,
      );
    }

    // Créer les avantages
    const createdAvantages: any[] = [];
    
    for (const avantageData of avantages) {
      const avantage = await this.prisma.avantage.create({
        data: {
          nom: avantageData.nom,
          valeur: avantageData.valeur ?? 0, // Valeur par défaut : 0 si non spécifiée
          isGratuit: avantageData.isGratuit ?? false, // Valeur par défaut : false si non spécifiée
          offres: offreId ? {
            create: {
              offreId,
            },
          } : undefined,
        },
        include: {
          offres: {
            include: {
              offre: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
      });

      createdAvantages.push({
        ...avantage,
        valeur: Number(avantage.valeur),
        offres: avantage.offres.map(o => o.offre),
      });
    }

    return this.formatResponse(
      createdAvantages,
      'Avantages créés',
      `${avantages.length} avantage(s) créé(s) avec succès${offreId ? ` et associé(s) à l'offre` : ''}.`,
    );
  }

  async findAll(query: QueryAvantageDto) {
    const { nom, valeurMin, valeurMax, isGratuit, offreId, page = 1, limit = 10 } = query;

    const where: any = {};

    if (nom) {
      where.nom = {
        contains: nom,
      };
    }

    if (valeurMin !== undefined || valeurMax !== undefined) {
      where.valeur = {};
      if (valeurMin !== undefined) {
        where.valeur.gte = valeurMin;
      }
      if (valeurMax !== undefined) {
        where.valeur.lte = valeurMax;
      }
    }

    if (isGratuit !== undefined) {
      where.isGratuit = isGratuit;
    }

    // Filtrage par offre
    if (offreId) {
      where.offres = {
        some: {
          offreId: offreId,
        },
      };
    }

    const skip = (page - 1) * limit;

    const [avantages, total] = await Promise.all([
      this.prisma.avantage.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ valeur: 'desc' }, { nom: 'asc' }, { createdAt: 'desc' }],
        include: {
          offres: {
            include: {
              offre: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.avantage.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Convertir les valeurs Decimal en nombres et simplifier la structure des offres
    const avantagesWithNumbers = avantages.map(avantage => ({
      ...avantage,
      valeur: Number(avantage.valeur),
      offres: avantage.offres.map(o => o.offre),
    }));

    return this.formatResponse(
      {
        avantages: avantagesWithNumbers,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Liste des avantages',
      `${avantages.length} avantage(s) sur ${total} récupéré(s) avec succès.`,
    );
  }

  async findOne(id: number) {
    const avantage = await this.prisma.avantage.findUnique({
      where: { id },
      include: {
        offres: {
          include: {
            offre: {
              select: {
                id: true,
                nom: true,
                operateur: {
                  select: {
                    id: true,
                    nom: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!avantage) {
      throw new NotFoundException(
        `Avantage avec l'ID ${id} introuvable`,
      );
    }

    const avantageWithNumber = {
      ...avantage,
      valeur: Number(avantage.valeur),
      offres: avantage.offres.map(o => o.offre),
    };

    return this.formatResponse(
      avantageWithNumber,
      'Avantage récupéré',
      `Avantage "${avantage.nom}" récupéré avec succès.`,
    );
  }

  async update(id: number, updateAvantageDto: UpdateAvantageDto) {
    const { offreId, nom, valeur, isGratuit } = updateAvantageDto;

    // Vérifier si l'avantage existe
    const existingAvantage = await this.prisma.avantage.findUnique({
      where: { id },
    });

    if (!existingAvantage) {
      throw new NotFoundException(
        `Avantage avec l'ID ${id} introuvable`,
      );
    }

    // Si le nom change, vérifier qu'il n'existe pas déjà
    if (nom && nom !== existingAvantage.nom) {
      const conflictingAvantage = await this.prisma.avantage.findFirst({
        where: {
          nom: nom,
          id: { not: id },
        },
      });

      if (conflictingAvantage) {
        throw new ConflictException(
          `Un avantage avec le nom "${nom}" existe déjà`,
        );
      }
    }

    // Si offreId est fourni, vérifier qu'elle existe
    if (offreId) {
      const existingOffre = await this.prisma.offre.findUnique({
        where: { id: offreId },
        select: { id: true, nom: true },
      });

      if (!existingOffre) {
        throw new BadRequestException(
          `L'offre avec l'ID ${offreId} n'existe pas`,
        );
      }
    }

    // Mettre à jour l'avantage
    const updateData: any = {};
    if (nom !== undefined) updateData.nom = nom;
    if (valeur !== undefined) updateData.valeur = valeur;
    if (isGratuit !== undefined) updateData.isGratuit = isGratuit;

    if (offreId !== undefined) {
      updateData.offres = {
        deleteMany: {}, // Supprimer toutes les relations existantes
        create: offreId ? [{ offreId }] : [], // Créer la nouvelle relation si offreId existe
      };
    }

    const updatedAvantage = await this.prisma.avantage.update({
      where: { id },
      data: updateData,
      include: {
        offres: {
          include: {
            offre: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    const avantageWithNumber = {
      ...updatedAvantage,
      valeur: Number(updatedAvantage.valeur),
      offres: updatedAvantage.offres.map(o => o.offre),
    };

    return this.formatResponse(
      avantageWithNumber,
      'Avantage mis à jour',
      `Avantage "${updatedAvantage.nom}" mis à jour avec succès${offreId ? ` et associé à l'offre` : ''}.`,
    );
  }

  async remove(id: number) {
    const avantage = await this.prisma.avantage.findUnique({
      where: { id },
      include: {
        offres: {
          include: {
            offre: {
              select: { id: true, nom: true }
            }
          }
        },
        options: {
          include: {
            option: {
              select: { id: true, nom: true }
            }
          }
        },
      },
    });

    if (!avantage) {
      throw new NotFoundException(
        `Avantage avec l'ID ${id} introuvable`,
      );
    }

    // Collecter les informations sur les liaisons pour le message de retour
    const offresLiees = avantage.offres.map(oa => oa.offre);
    const optionsLiees = avantage.options.map(opa => opa.option);
    
    const totalLiaisons = offresLiees.length + optionsLiees.length;
    
    // Messages informatifs sur les liaisons qui seront supprimées
    const liaisonsInfo: string[] = [];
    if (offresLiees.length > 0) {
      liaisonsInfo.push(`${offresLiees.length} offre(s): ${offresLiees.map(o => o.nom).join(', ')}`);
    }
    if (optionsLiees.length > 0) {
      liaisonsInfo.push(`${optionsLiees.length} option(s): ${optionsLiees.map(o => o.nom).join(', ')}`);
    }

    // Utiliser une transaction pour assurer la cohérence
    await this.prisma.$transaction(async (prisma) => {
      // Supprimer d'abord toutes les liaisons avec les offres
      if (offresLiees.length > 0) {
        await prisma.offreAvantage.deleteMany({
          where: { avantageId: id }
        });
      }

      // Supprimer toutes les liaisons avec les options
      if (optionsLiees.length > 0) {
        await prisma.optionAvantage.deleteMany({
          where: { avantageId: id }
        });
      }

      // Enfin, supprimer l'avantage lui-même
      await prisma.avantage.delete({
        where: { id },
      });
    });

    // Message de retour détaillé
    let message = `Avantage "${avantage.nom}" supprimé avec succès.`;
    if (totalLiaisons > 0) {
      message += ` Les liaisons suivantes ont été supprimées automatiquement: ${liaisonsInfo.join(', ')}.`;
    }

    return this.formatResponse(
      { 
        id,
        liaisonsSupprimeesCount: totalLiaisons,
        offresLiees: offresLiees.map(o => ({ id: o.id, nom: o.nom })),
        optionsLiees: optionsLiees.map(o => ({ id: o.id, nom: o.nom }))
      },
      'Avantage supprimé',
      message,
    );
  }

  // Méthodes utilitaires pour la gestion des relations avec les offres
  async getAvantagesForOffre(offreId: number) {
    const offreAvantages = await this.prisma.offreAvantage.findMany({
      where: { offreId },
      include: {
        avantage: true,
      },
    });

    return offreAvantages.map(oa => ({
      ...oa.avantage,
      valeur: Number(oa.avantage.valeur),
    }));
  }

  async getOffresForAvantage(avantageId: number) {
    const offreAvantages = await this.prisma.offreAvantage.findMany({
      where: { avantageId },
      include: {
        offre: {
          include: {
            operateur: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        },
      },
    });

    return offreAvantages.map(oa => oa.offre);
  }

  async updateMultiple(updateData: UpdateMultipleAvantageDto) {
    const { avantages } = updateData;
    const updatedAvantages: any[] = [];
    const errors: string[] = [];

    // Récupérer tous les IDs pour vérifier leur existence
    const ids = avantages.map(a => a.id);
    const existingAvantages = await this.prisma.avantage.findMany({
      where: { id: { in: ids } },
      select: { id: true, nom: true },
    });

    const existingIds = new Set(existingAvantages.map(a => a.id));
    const notFoundIds = ids.filter(id => !existingIds.has(id));

    if (notFoundIds.length > 0) {
      throw new NotFoundException(
        `Avantage(s) avec les ID(s) ${notFoundIds.join(', ')} introuvable(s)`,
      );
    }

    // Vérifier les conflits de noms
    for (const avantage of avantages) {
      if (avantage.nom) {
        const conflictingAvantage = await this.prisma.avantage.findFirst({
          where: {
            nom: avantage.nom,
            id: { not: avantage.id },
          },
        });

        if (conflictingAvantage) {
          errors.push(`Un avantage avec le nom "${avantage.nom}" existe déjà (conflit avec ID ${avantage.id})`);
        }
      }
    }

    // Vérifier les offres si elles sont spécifiées
    const offreIds = avantages
      .filter(a => a.offreId !== undefined && a.offreId !== null)
      .map(a => a.offreId as number);
    
    if (offreIds.length > 0) {
      const existingOffres = await this.prisma.offre.findMany({
        where: { id: { in: offreIds } },
        select: { id: true },
      });

      const existingOffreIds = new Set(existingOffres.map(o => o.id));
      const notFoundOffreIds = offreIds.filter(id => !existingOffreIds.has(id));

      if (notFoundOffreIds.length > 0) {
        errors.push(`Offre(s) avec les ID(s) ${notFoundOffreIds.join(', ')} introuvable(s)`);
      }
    }

    if (errors.length > 0) {
      throw new ConflictException(errors.join('; '));
    }

    // Effectuer les mises à jour
    for (const avantage of avantages) {
      const { id, offreId, nom, valeur } = avantage;
      
      // Préparer les données de mise à jour
      const updateData: any = {};
      if (nom !== undefined) updateData.nom = nom;
      if (valeur !== undefined) updateData.valeur = valeur;

      if (offreId !== undefined) {
        updateData.offres = {
          deleteMany: {}, // Supprimer toutes les relations existantes
          create: offreId ? [{ offreId }] : [], // Créer la nouvelle relation si offreId existe
        };
      }

      const updatedAvantage = await this.prisma.avantage.update({
        where: { id },
        data: updateData,
        include: {
          offres: {
            include: {
              offre: {
                select: {
                  id: true,
                  nom: true,
                },
              },
            },
          },
        },
      });

      const avantageWithNumber = {
        ...updatedAvantage,
        valeur: Number(updatedAvantage.valeur),
        offres: updatedAvantage.offres.map(o => o.offre),
      };

      updatedAvantages.push(avantageWithNumber);
    }

    return this.formatResponse(
      updatedAvantages,
      'Avantages mis à jour',
      `${updatedAvantages.length} avantage(s) mis à jour avec succès.`,
    );
  }
}
