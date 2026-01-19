import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOptionDto } from './dto/create-option.dto';
import { UpdateOptionDto } from './dto/update-option.dto';
import { QueryOptionDto } from './dto/query-option.dto';

@Injectable()
export class OptionService {
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

  async create(createOptionDto: CreateOptionDto) {
    const {
      offreId,
      nom,
      tva,
      nombreSouscriptions,
      traficOption,
      fraisSouscription,
      tarifMinuteOnNet,
      tarifMinuteOffNet,
      annee,
      trafic,
      structuresTarifaires,
      avantages,
      consommationsMoyennes,
    } = createOptionDto;

    // Vérifier que l'offre existe
    const existingOffre = await this.prisma.offre.findUnique({
      where: { id: offreId },
      select: { id: true, nom: true },
    });

    if (!existingOffre) {
      throw new BadRequestException(
        `L'offre avec l'ID ${offreId} n'existe pas`,
      );
    }

    // Vérifier l'unicité du nom d'option pour cette offre
    const existingOption = await this.prisma.option.findFirst({
      where: {
        offreId: offreId,
        nom: nom,
      },
    });

    if (existingOption) {
      throw new ConflictException(
        `Une option avec le nom "${nom}" existe déjà pour cette offre`,
      );
    }

    // Vérifier les structures tarifaires si fournies
    if (structuresTarifaires && structuresTarifaires.length > 0) {
      const structureIds = structuresTarifaires.map(s => s.id);
      const existingStructures = await this.prisma.structureTarifaire.findMany({
        where: { id: { in: structureIds } },
        select: { id: true },
      });

      if (existingStructures.length !== structureIds.length) {
        const foundIds = existingStructures.map(s => s.id);
        const missingIds = structureIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(
          `Les structures tarifaires avec les IDs suivants n'existent pas : ${missingIds.join(', ')}`,
        );
      }
    }

    // Vérifier les avantages si fournis
    if (avantages && avantages.length > 0) {
      const avantageIds = avantages.map(a => a.id);
      const existingAvantages = await this.prisma.avantage.findMany({
        where: { id: { in: avantageIds } },
        select: { id: true },
      });

      if (existingAvantages.length !== avantageIds.length) {
        const foundIds = existingAvantages.map(a => a.id);
        const missingIds = avantageIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(
          `Les avantages avec les IDs suivants n'existent pas : ${missingIds.join(', ')}`,
        );
      }
    }

    // Vérifier les consommations moyennes si fournies
    if (consommationsMoyennes && consommationsMoyennes.length > 0) {
      const consommationIds = consommationsMoyennes.map(c => c.id);
      const existingConsommations = await this.prisma.consommationMoyenne.findMany({
        where: { id: { in: consommationIds } },
        select: { id: true },
      });

      if (existingConsommations.length !== consommationIds.length) {
        const foundIds = existingConsommations.map(c => c.id);
        const missingIds = consommationIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(
          `Les consommations moyennes avec les IDs suivants n'existent pas : ${missingIds.join(', ')}`,
        );
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // Créer l'option
      const option = await tx.option.create({
        data: {
          offreId,
          nom,
          tva,
          nombreSouscriptions,
          traficOption,
          fraisSouscription,
          tarifMinuteOnNet,
          tarifMinuteOffNet,
          annee,
          trafic: trafic ?? 0, // Valeur par défaut à 0 si non fournie
        },
      });

      // Gérer les structures tarifaires (par défaut ou fournies)
      let structuresToProcess = structuresTarifaires ?? [];
      
      // Récupérer toutes les structures obligatoires
      const obligatoryStructures = await tx.structureTarifaire.findMany({
        where: { estObligatoire: true },
        select: { id: true, valeur: true },
      });

      if (obligatoryStructures.length > 0) {
        const providedIds = structuresToProcess.map(s => s.id);
        
        // Identifier les structures obligatoires manquantes
        const missingObligatory = obligatoryStructures.filter(
          os => !providedIds.includes(os.id)
        );

        // Ajouter les structures obligatoires manquantes avec leurs valeurs actuelles
        if (missingObligatory.length > 0) {
          structuresToProcess.push(...missingObligatory.map(s => ({
            id: s.id,
            valeur: Number(s.valeur), // Conversion Decimal vers Number
          })));
        }
      }

      // Si aucune structure n'est fournie du tout, ajouter les 2 premières par défaut
      if (structuresToProcess.length === 0) {
        const defaultStructures = await tx.structureTarifaire.findMany({
          take: 2,
          orderBy: { id: 'asc' },
          select: { id: true, valeur: true },
        });
        
        structuresToProcess = defaultStructures.map(s => ({
          id: s.id,
          valeur: Number(s.valeur), // Conversion Decimal vers Number
        }));
      }

      // Créer les associations et mettre à jour les valeurs des structures tarifaires
      for (const structure of structuresToProcess) {
        // Créer l'association
        await tx.optionStructureTarifaire.create({
          data: {
            optionId: option.id,
            structureTarifaireId: structure.id,
            valeur: structure.valeur,
          },
        });

        // Mettre à jour la valeur de la structure tarifaire
        await tx.structureTarifaire.update({
          where: { id: structure.id },
          data: { valeur: structure.valeur },
        });
      }

      // Créer les associations avec les avantages et mettre à jour leurs valeurs
      if (avantages && avantages.length > 0) {
        for (const avantage of avantages) {
          // Créer l'association
          await tx.optionAvantage.create({
            data: {
              optionId: option.id,
              avantageId: avantage.id,
              valeur: avantage.valeur,
            },
          });

          // Mettre à jour la valeur de l'avantage
          await tx.avantage.update({
            where: { id: avantage.id },
            data: { valeur: avantage.valeur },
          });
        }
      }

      // Créer les associations avec les consommations moyennes et mettre à jour leurs valeurs
      if (consommationsMoyennes && consommationsMoyennes.length > 0) {
        for (const consommation of consommationsMoyennes) {
          // Créer l'association
          await tx.optionConsommationMoyenne.create({
            data: {
              optionId: option.id,
              consommationMoyenneId: consommation.id,
              valeur: consommation.valeur,
            },
          });

          // Mettre à jour la valeur de la consommation moyenne
          await tx.consommationMoyenne.update({
            where: { id: consommation.id },
            data: { valeur: consommation.valeur },
          });
        }
      }

      // Récupérer l'option créée avec toutes ses associations
      const optionWithAssociations = await tx.option.findUnique({
        where: { id: option.id },
        include: {
          offre: {
            select: {
              id: true,
              nom: true,
            },
          },
          structuresTarifaires: {
            include: {
              structureTarifaire: {
                select: {
                  id: true,
                  nom: true,
                  valeur: true,
                  estObligatoire: true,
                },
              },
            },
          },
          avantages: {
            include: {
              avantage: {
                select: {
                  id: true,
                  nom: true,
                  valeur: true,
                },
              },
            },
          },
          consommationsMoyennes: {
            include: {
              consommationMoyenne: {
                select: {
                  id: true,
                  nom: true,
                  valeur: true,
                },
              },
            },
          },
        },
      });

      return this.formatCreateOptionResponse(optionWithAssociations, 'créée');
    });
  }

  private formatCreateOptionResponse(option: any, action: string) {
    const formattedOption = this.formatOptionResponse(option);
    return this.formatResponse(
      formattedOption,
      'Option ' + action,
      `Option "${option.nom}" ${action} avec succès.`,
    );
  }

  private formatOptionResponse(option: any) {
    return {
      ...option,
      tva: Number(option.tva),
      traficOption: Number(option.traficOption),
      fraisSouscription: Number(option.fraisSouscription),
      tarifMinuteOnNet: Number(option.tarifMinuteOnNet),
      tarifMinuteOffNet: Number(option.tarifMinuteOffNet),
      trafic: Number(option.trafic || 0),
      structuresTarifaires: option.structuresTarifaires
        ?.map(st => ({
          ...st.structureTarifaire,
          // valeur: Number(st.structureTarifaire.valeur),
          valeur: Number(st.valeur), // ✅ valeur depuis OptionStructureTarifaire
        }))
        .sort((a, b) => {
          // Mettre les structures obligatoires en premier
          if (a.estObligatoire && !b.estObligatoire) return -1;
          if (!a.estObligatoire && b.estObligatoire) return 1;
          // Si même statut obligatoire, trier par nom
          return a.nom.localeCompare(b.nom);
        }) || [],
      avantages: option.avantages?.map(av => ({
        ...av.avantage,
        // valeur: Number(av.avantage.valeur),
        valeur: Number(av.valeur), // ✅ valeur depuis OptionAvantage
      })) || [],
      consommationsMoyennes: option.consommationsMoyennes?.map(cm => ({
        ...cm.consommationMoyenne,
        // valeur: Number(cm.consommationMoyenne.valeur),
        valeur: Number(cm.valeur), // ✅ valeur depuis OptionConsommationMoyenne
      })) || [],
    };
  }

  async findAll(query: QueryOptionDto) {
    const {
      nom,
      offreId,
      annee,
      traficMin,
      traficMax,
      nombreSouscriptionsMin,
      nombreSouscriptionsMax,
      page = 1,
      limit = 10,
    } = query;

    const where: any = {};

    if (nom) {
      where.nom = {
        contains: nom,
      };
    }

    if (offreId) {
      where.offreId = offreId;
    }

    if (annee) {
      where.annee = annee;
    }

    if (traficMin !== undefined || traficMax !== undefined) {
      where.trafic = {};
      if (traficMin !== undefined) where.trafic.gte = traficMin;
      if (traficMax !== undefined) where.trafic.lte = traficMax;
    }

    if (nombreSouscriptionsMin !== undefined || nombreSouscriptionsMax !== undefined) {
      where.nombreSouscriptions = {};
      if (nombreSouscriptionsMin !== undefined) where.nombreSouscriptions.gte = nombreSouscriptionsMin;
      if (nombreSouscriptionsMax !== undefined) where.nombreSouscriptions.lte = nombreSouscriptionsMax;
    }

    const skip = (page - 1) * limit;

    const [options, total] = await this.prisma.$transaction([
      this.prisma.option.findMany({
        where,
        skip,
        take: limit,
        include: {
          offre: {
            select: {
              id: true,
              nom: true,
            },
          },
          structuresTarifaires: {
            include: {
              structureTarifaire: {
                select: {
                  id: true,
                  nom: true,
                  valeur: true,
                  estObligatoire: true,
                },
              },
            },
          },
          avantages: {
            include: {
              avantage: {
                select: {
                  id: true,
                  nom: true,
                  valeur: true,
                },
              },
            },
          },
          consommationsMoyennes: {
            include: {
              consommationMoyenne: {
                select: {
                  id: true,
                  nom: true,
                  valeur: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.option.count({ where }),
    ]);

    const formattedOptions = options.map(option => this.formatOptionResponse(option));

    return {
      success: true,
      statusCode: 200,
      code: 'success',
      title: 'Options récupérées',
      message: 'Liste des options récupérée avec succès.',
      data: formattedOptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // formatOptionResponsefindOneyassin(option: any) {
  //   return {
  //     ...option,
  //     structuresTarifaires: option.structuresTarifaires.map((item) => ({
  //       id: item.structureTarifaire.id,
  //       nom: item.structureTarifaire.nom,
  //       estObligatoire: item.structureTarifaire.estObligatoire,
  //       valeur: item.valeur, // 👈 valeur venant de OptionStructureTarifaire
  //     })),
  //     avantages: option.avantages.map((item) => ({
  //       id: item.avantage.id,
  //       nom: item.avantage.nom,
  //       valeur: item.avantage.valeur,
  //     })),
  //     consommationsMoyennes: option.consommationsMoyennes.map((item) => ({
  //       id: item.consommationMoyenne.id,
  //       nom: item.consommationMoyenne.nom,
  //       valeur: item.consommationMoyenne.valeur,
  //     })),
  //   };
  // }


  async findOne(id: number) {
    const option = await this.prisma.option.findUnique({
      where: { id },
      include: {
        offre: {
          select: {
            id: true,
            nom: true,
          },
        },
        structuresTarifaires: {
          include: {
            structureTarifaire: {
              select: {
                id: true,
                nom: true,
                valeur: true,
                estObligatoire: true,
              },
            },
          },
        },
        avantages: {
          include: {
            avantage: {
              select: {
                id: true,
                nom: true,
                valeur: true,
              },
            },
          },
        },
        consommationsMoyennes: {
          include: {
            consommationMoyenne: {
              select: {
                id: true,
                nom: true,
                valeur: true,
              },
            },
          },
        },
      },
    });

    if (!option) {
      throw new NotFoundException(`Option avec l'ID ${id} introuvable`);
    }

    return this.formatResponse(
      this.formatOptionResponse(option),
      'Option récupérée',
      `Option "${option.nom}" récupérée avec succès.`,
    );
  }

  async update(id: number, updateOptionDto: UpdateOptionDto) {
    // Vérifier que l'option existe
    const existingOption = await this.prisma.option.findUnique({
      where: { id },
    });

    if (!existingOption) {
      throw new NotFoundException(`Option avec l'ID ${id} introuvable`);
    }

    const {
      offreId,
      nom,
      structuresTarifaires,
      avantages,
      consommationsMoyennes,
      ...updateData
    } = updateOptionDto;

    // Vérifications similaires à la création...
    if (offreId && offreId !== existingOption.offreId) {
      const existingOffre = await this.prisma.offre.findUnique({
        where: { id: offreId },
      });

      if (!existingOffre) {
        throw new BadRequestException(
          `L'offre avec l'ID ${offreId} n'existe pas`,
        );
      }
    }

    // Vérifier l'unicité du nom si modifié
    if (nom && nom !== existingOption.nom) {
      const conflictingOption = await this.prisma.option.findFirst({
        where: {
          offreId: offreId || existingOption.offreId,
          nom: nom,
          id: { not: id },
        },
      });

      if (conflictingOption) {
        throw new ConflictException(
          `Une option avec le nom "${nom}" existe déjà pour cette offre`,
        );
      }
    }

    // Vérifier les structures tarifaires si fournies
    if (structuresTarifaires && structuresTarifaires.length > 0) {
      const structureIds = structuresTarifaires.map(s => s.id);
      const existingStructures = await this.prisma.structureTarifaire.findMany({
        where: { id: { in: structureIds } },
        select: { id: true },
      });

      if (existingStructures.length !== structureIds.length) {
        const foundIds = existingStructures.map(s => s.id);
        const missingIds = structureIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(
          `Les structures tarifaires avec les IDs suivants n'existent pas : ${missingIds.join(', ')}`,
        );
      }
    }

    // Vérifier les avantages si fournis
    if (avantages && avantages.length > 0) {
      const avantageIds = avantages.map(a => a.id);
      const existingAvantages = await this.prisma.avantage.findMany({
        where: { id: { in: avantageIds } },
        select: { id: true },
      });

      if (existingAvantages.length !== avantageIds.length) {
        const foundIds = existingAvantages.map(a => a.id);
        const missingIds = avantageIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(
          `Les avantages avec les IDs suivants n'existent pas : ${missingIds.join(', ')}`,
        );
      }
    }

    // Vérifier les consommations moyennes si fournies
    if (consommationsMoyennes && consommationsMoyennes.length > 0) {
      const consommationIds = consommationsMoyennes.map(c => c.id);
      const existingConsommations = await this.prisma.consommationMoyenne.findMany({
        where: { id: { in: consommationIds } },
        select: { id: true },
      });

      if (existingConsommations.length !== consommationIds.length) {
        const foundIds = existingConsommations.map(c => c.id);
        const missingIds = consommationIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(
          `Les consommations moyennes avec les IDs suivants n'existent pas : ${missingIds.join(', ')}`,
        );
      }
    }

    // Transaction pour mettre à jour l'option et ses relations
    return await this.prisma.$transaction(async (tx) => {
      // Mettre à jour les données de base
      const option = await tx.option.update({
        where: { id },
        data: {
          ...updateData,
          ...(offreId && { offreId }),
          ...(nom && { nom }),
        },
      });

      // Gérer les structures tarifaires
      if (structuresTarifaires !== undefined) {
        // Supprimer les associations existantes
        await tx.optionStructureTarifaire.deleteMany({
          where: { optionId: id },
        });

        if (structuresTarifaires.length > 0) {
          // Créer les nouvelles associations et mettre à jour les valeurs
          for (const structure of structuresTarifaires) {
            await tx.optionStructureTarifaire.create({
              data: {
                optionId: id,
                structureTarifaireId: structure.id,
                valeur: structure.valeur,
              },
            });

            // Mettre à jour la valeur de la structure tarifaire
            await tx.structureTarifaire.update({
              where: { id: structure.id },
              data: { valeur: structure.valeur },
            });
          }
        }
      }

      // Gérer les avantages
      if (avantages !== undefined) {
        // Supprimer les associations existantes
        await tx.optionAvantage.deleteMany({
          where: { optionId: id },
        });

        if (avantages.length > 0) {
          // Créer les nouvelles associations et mettre à jour les valeurs
          for (const avantage of avantages) {
            await tx.optionAvantage.create({
              data: {
                optionId: id,
                avantageId: avantage.id,
                valeur: avantage.valeur,
              },
            });

            // Mettre à jour la valeur de l'avantage
            await tx.avantage.update({
              where: { id: avantage.id },
              data: { valeur: avantage.valeur },
            });
          }
        }
      }

      // Gérer les consommations moyennes
      if (consommationsMoyennes !== undefined) {
        // Supprimer les associations existantes
        await tx.optionConsommationMoyenne.deleteMany({
          where: { optionId: id },
        });

        if (consommationsMoyennes.length > 0) {
          // Créer les nouvelles associations et mettre à jour les valeurs
          for (const consommation of consommationsMoyennes) {
            await tx.optionConsommationMoyenne.create({
              data: {
                optionId: id,
                consommationMoyenneId: consommation.id,
                valeur: consommation.valeur,
              },
            });

            // Mettre à jour la valeur de la consommation moyenne
            await tx.consommationMoyenne.update({
              where: { id: consommation.id },
              data: { valeur: consommation.valeur },
            });
          }
        }
      }

      // Récupérer l'option mise à jour avec toutes ses associations
      const updatedOptionWithAssociations = await tx.option.findUnique({
        where: { id },
        include: {
          offre: {
            select: {
              id: true,
              nom: true,
            },
          },
          structuresTarifaires: {
            include: {
              structureTarifaire: {
                select: {
                  id: true,
                  nom: true,
                  valeur: true,
                  estObligatoire: true,
                },
              },
            },
          },
          avantages: {
            include: {
              avantage: {
                select: {
                  id: true,
                  nom: true,
                  valeur: true,
                },
              },
            },
          },
          consommationsMoyennes: {
            include: {
              consommationMoyenne: {
                select: {
                  id: true,
                  nom: true,
                  valeur: true,
                },
              },
            },
          },
        },
      });

      return this.formatCreateOptionResponse(updatedOptionWithAssociations, 'modifiée');
    });
  }

  async remove(id: number) {
    const existingOption = await this.prisma.option.findUnique({
      where: { id },
      select: { nom: true },
    });

    if (!existingOption) {
      throw new NotFoundException(`Option avec l'ID ${id} introuvable`);
    }

    await this.prisma.option.delete({
      where: { id },
    });

    return this.formatResponse(
      null,
      'Option supprimée',
      `Option "${existingOption.nom}" supprimée avec succès.`,
    );
  }
}
