// src/archive/archive.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { ArchiveQueryDto } from './dto/archive-query.dto';
import { ViderCoffresDto } from './dto/vider-coffres.dto';
import { RetirerArchivesDto } from './dto/retirer-archives.dto';
import { ArchivesTransferesQueryDto } from './dto/archives-transferes-query.dto';
import { UnarchiveDto } from './dto/unarchive.dto';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ArchiveService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
  ) {}

  // 📝 Créer une archive
  async create(createArchiveDto: CreateArchiveDto) {
    const { idCourriers = [], idTransmissions = [], idCourriersDepart = [], idSalle, idCoffre } = createArchiveDto;

    // Vérifier que la salle existe, n'est pas supprimée et est active
    const salle = await this.prismaService.salle.findFirst({
      where: { 
        id: idSalle, 
        isDelete: false,
        isActive: true,
      },
    });

    if (!salle) {
      throw new BadRequestException(`La salle avec l'ID ${idSalle} n'existe pas, est supprimée ou inactive.`);
    }

    // Vérifier que le coffre existe, n'est pas supprimé et est actif
    const coffre = await this.prismaService.coffre.findFirst({
      where: {
        id: idCoffre,
        isDelete: false,
        isActive: true,
      },
    });

    if (!coffre) {
      throw new NotFoundException('Coffre non trouvé, supprimé ou inactif.');
    }

    // Vérifier que le coffre appartient bien à la salle
    if (coffre.idSalle !== idSalle) {
      throw new BadRequestException(`Le coffre avec l'ID ${idCoffre} n'appartient pas à la salle avec l'ID ${idSalle}.`);
    }

    // Vérifier la capacité maximale du coffre
    if (coffre.nombrePlaceActuelle >= coffre.tailleMaximale) {
      throw new BadRequestException('Le coffre a atteint sa capacité maximale.');
    }

    // Créer l'archive et mettre à jour les entités (transaction)
    const result = await this.prismaService.$transaction(async (prisma) => {
      let transmissionsLieesToCourriers: number[] = [];
      
      // Mettre à jour les courriers et récupérer leurs transmissions liées
      if (idCourriers.length > 0) {
        // Récupérer toutes les transmissions liées aux courriers à archiver
        const transmissionsLiees = await prisma.transmission.findMany({
          where: { 
            idCourrier: { in: idCourriers },
            isArchive: false // Seulement celles pas déjà archivées
          },
          select: { id: true }
        });
        
        transmissionsLieesToCourriers = transmissionsLiees.map(t => t.id);
        
        // Archiver les courriers
        await prisma.courrier.updateMany({
          where: { id: { in: idCourriers } },
          data: {
            statut: 'Archivé',
            isArchive: true,
            statutArchive: 'non transféré',
          },
        });
        
        // Archiver automatiquement toutes les transmissions liées
        if (transmissionsLieesToCourriers.length > 0) {
          await prisma.transmission.updateMany({
            where: { id: { in: transmissionsLieesToCourriers } },
            data: {
              statut: 'Archivé',
              isArchive: true,
              statutArchive: 'non transféré',
            },
          });
        }
      }

      // Mettre à jour les transmissions explicitement spécifiées et archiver leurs courriers liés
      const transmissionsExplicites = idTransmissions.filter(id => 
        !transmissionsLieesToCourriers.includes(id)
      );
      
      let courriersLiesAuxTransmissions: number[] = [];
      
      if (transmissionsExplicites.length > 0) {
        // Récupérer les courriers liés aux transmissions à archiver
        const transmissionsAvecCourriers = await prisma.transmission.findMany({
          where: { 
            id: { in: transmissionsExplicites },
            isArchive: false // Seulement celles pas déjà archivées
          },
          select: { id: true, idCourrier: true }
        });
        
        // Extraire les IDs des courriers liés (qui ne sont pas déjà dans idCourriers)
        const courriersLiesUniques = [...new Set(
          transmissionsAvecCourriers
            .map(t => t.idCourrier)
            .filter((idCourrier): idCourrier is number => idCourrier !== null && !idCourriers.includes(idCourrier))
        )];
        
        courriersLiesAuxTransmissions = courriersLiesUniques;
        
        // Archiver les transmissions
        await prisma.transmission.updateMany({
          where: { id: { in: transmissionsExplicites } },
          data: {
            statut: 'Archivé',
            isArchive: true,
            statutArchive: 'non transféré',
          },
        });
        
        // Archiver automatiquement les courriers liés aux transmissions
        if (courriersLiesAuxTransmissions.length > 0) {
          await prisma.courrier.updateMany({
            where: { 
              id: { in: courriersLiesAuxTransmissions },
              isArchive: false // Seulement ceux pas déjà archivés
            },
            data: {
              statut: 'Archivé',
              isArchive: true,
              statutArchive: 'non transféré',
            },
          });
        }
      }

      // Mettre à jour les courriers départ
      if (idCourriersDepart.length > 0) {
        await prisma.courrierDepart.updateMany({
          where: { id: { in: idCourriersDepart } },
          data: {
            isArchive: true,
            statutArchive: 'non transféré',
          },
        });
      }

      // Créer l'archive avec tous les éléments (courriers originaux + liés, transmissions)
      const tousLesCourriers = [...new Set([...idCourriers, ...courriersLiesAuxTransmissions])];
      const toutesLesTransmissions = [...new Set([...transmissionsLieesToCourriers, ...transmissionsExplicites])];
      
      const archive = await prisma.archive.create({
        data: {
          idCourrier: tousLesCourriers,
          idTransmission: toutesLesTransmissions,
          idCourrierDepart: idCourriersDepart,
          idSalle,
          idCoffre,
          fichier: '',
        },
      });

      // Incrémenter le nombre de places dans le coffre
      const updatedCoffre = await prisma.coffre.update({
        where: { id: idCoffre },
        data: {
          nombrePlaceActuelle: {
            increment: 1,
          },
        },
      });

      return { 
        archive, 
        updatedCoffre, 
        transmissionsLieesToCourriers: transmissionsLieesToCourriers.length,
        transmissionsExplicites: transmissionsExplicites.length,
        courriersLiesAuxTransmissions: courriersLiesAuxTransmissions.length
      };
    });

    const totalTransmissions = result.transmissionsLieesToCourriers + result.transmissionsExplicites;
    const messageDetails: string[] = [];
    
    if (idCourriers.length > 0) {
      messageDetails.push(`${idCourriers.length} courrier(s)`);
      if (result.transmissionsLieesToCourriers > 0) {
        messageDetails.push(`${result.transmissionsLieesToCourriers} transmission(s) liée(s) automatiquement`);
      }
    }
    
    if (result.transmissionsExplicites > 0) {
      messageDetails.push(`${result.transmissionsExplicites} transmission(s) explicite(s)`);
      if (result.courriersLiesAuxTransmissions > 0) {
        messageDetails.push(`${result.courriersLiesAuxTransmissions} courrier(s) parent(s) automatiquement`);
      }
    }
    
    if (idCourriersDepart.length > 0) {
      messageDetails.push(`${idCourriersDepart.length} courrier(s) départ`);
    }

    return this.responseFormatter.success(
      result.archive,
      'Création archive',
      `Archive créée avec succès: ${messageDetails.join(', ')}. Coffre: ${result.updatedCoffre.nombrePlaceActuelle}/${result.updatedCoffre.tailleMaximale} places.`,
    );
  }

  // 📋 Liste de toutes les archives avec filtres et pagination
  async findAll(query: ArchiveQueryDto) {
    const { idSalle, idCoffre, isActive, isDelete } = query;

    // Construction des filtres pour les salles
    const salleWhere: any = { isDelete: false };
    if (idSalle !== undefined) {
      salleWhere.id = idSalle;
    }

    // Construction des filtres pour les coffres
    const coffreWhere: any = { isDelete: false };
    if (idCoffre !== undefined) {
      coffreWhere.id = idCoffre;
    }
    if (isActive !== undefined) {
      coffreWhere.isActive = isActive;
    }

    // Construction des filtres pour les archives
    const archiveWhere: any = {};
    if (isDelete !== undefined) {
      archiveWhere.isDelete = isDelete;
    } else {
      archiveWhere.isDelete = false;
    }

    // Récupérer toutes les salles
    const salles = await this.prismaService.salle.findMany({
      where: salleWhere,
      orderBy: { nom: 'asc' },
    });

    const totalSalles = salles.length;
    let totalCoffres = 0;
    const data: any[] = [];

    // Pour chaque salle, récupérer les coffres et les archives
    for (const salle of salles) {
      const coffres = await this.prismaService.coffre.findMany({
        where: {
          ...coffreWhere,
          idSalle: salle.id,
        },
        orderBy: { nom: 'asc' },
      });

      if (coffres.length === 0) continue;

      totalCoffres += coffres.length;
      const coffreList: any[] = [];
      let totalArchivesInSalle = 0;

      for (const coffre of coffres) {
        const archives = await this.prismaService.archive.findMany({
          where: {
            ...archiveWhere,
            idCoffre: coffre.id,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (archives.length === 0) continue;

        totalArchivesInSalle += archives.length;

        // Pour chaque archive, récupérer les données des courriers, transmissions et courriers départ
        const archivesWithDetails = await Promise.all(
          archives.map(async (archive) => {
            const idCourriers = archive.idCourrier as any as number[] || [];
            const idTransmissions = archive.idTransmission as any as number[] || [];
            const idCourriersDepart = archive.idCourrierDepart as any as number[] || [];

            // Récupérer les courriers
            const courriers = idCourriers.length > 0
              ? await this.prismaService.courrier.findMany({
                  where: { id: { in: idCourriers } },
                  select: {
                    id: true,
                    numero: true,
                    reference: true,
                    objet: true,
                    dateArrivee: true,
                    priorite: true,
                    statut: true,
                  },
                })
              : [];

            // Récupérer les transmissions
            const transmissions = idTransmissions.length > 0
              ? await this.prismaService.transmission.findMany({
                  where: { id: { in: idTransmissions } },
                  select: {
                    id: true,
                    idCourrier: true,
                    instruction: true,
                    dateInstruction: true,
                    statut: true,
                  },
                })
              : [];

            // Récupérer les courriers départ
            const courriersDepart = idCourriersDepart.length > 0
              ? await this.prismaService.courrierDepart.findMany({
                  where: { id: { in: idCourriersDepart } },
                  select: {
                    id: true,
                    numeroReference: true,
                    numeroActe: true,
                    typeCourrier: true,
                    dateSignature: true,
                  },
                })
              : [];

            return {
              id: archive.id,
              idSalle: archive.idSalle,
              idCoffre: archive.idCoffre,
              createdAt: archive.createdAt,
              courrier: courriers.length > 0 ? courriers[0] : null,
              transmission: transmissions.length > 0 ? transmissions[0] : null,
              courrierDepart: courriersDepart.length > 0 ? courriersDepart[0] : null,
            };
          }),
        );

        coffreList.push({
          coffre: {
            id: coffre.id,
            nom: coffre.nom,
            nombrePlaceActuelle: coffre.nombrePlaceActuelle,
            tailleMaximale: coffre.tailleMaximale,
            isActive: coffre.isActive,
          },
          totalArchives: archives.length,
          archives: archivesWithDetails,
        });
      }

      if (coffreList.length > 0) {
        data.push({
          salle: {
            id: salle.id,
            nom: salle.nom,
            isActive: salle.isActive,
          },
          totalArchives: totalArchivesInSalle,
          totalCoffres: coffreList.length,
          coffres: coffreList,
        });
      }
    }

    return this.responseFormatter.success(
      {
        totalSalles,
        totalCoffres,
        data,
      },
      'Liste des archives',
      `${totalSalles} salle(s) avec ${totalCoffres} coffre(s) récupérée(s) avec succès.`,
    );
  }

  // 🔍 Récupérer une archive par ID
  async findOne(id: number) {
    const archive = await this.prismaService.archive.findUnique({
      where: { id },
    });

    if (!archive) {
      throw new NotFoundException('Archive non trouvée.');
    }

    // Récupérer la salle
    const salle = await this.prismaService.salle.findUnique({
      where: { id: archive.idSalle },
      select: {
        id: true,
        nom: true,
        isActive: true,
      },
    });

    // Récupérer le coffre
    const coffre = await this.prismaService.coffre.findUnique({
      where: { id: archive.idCoffre },
      select: {
        id: true,
        nom: true,
        nombrePlaceActuelle: true,
        tailleMaximale: true,
        isActive: true,
      },
    });

    const idCourriers = archive.idCourrier as any as number[] || [];
    const idTransmissions = archive.idTransmission as any as number[] || [];
    const idCourriersDepart = archive.idCourrierDepart as any as number[] || [];

    // Récupérer les courriers
    const courriers = idCourriers.length > 0
      ? await this.prismaService.courrier.findMany({
          where: { id: { in: idCourriers } },
          select: {
            id: true,
            numero: true,
            reference: true,
            objet: true,
            dateArrivee: true,
            priorite: true,
            statut: true,
          },
        })
      : [];

    // Récupérer les transmissions
    const transmissions = idTransmissions.length > 0
      ? await this.prismaService.transmission.findMany({
          where: { id: { in: idTransmissions } },
          select: {
            id: true,
            idCourrier: true,
            instruction: true,
            statut: true,
          },
        })
      : [];

    // Récupérer les courriers départ
    const courriersDepart = idCourriersDepart.length > 0
      ? await this.prismaService.courrierDepart.findMany({
          where: { id: { in: idCourriersDepart } },
          select: {
            id: true,
            numeroReference: true,
            numeroActe: true,
            typeCourrier: true,
          },
        })
      : [];

    const response = {
      id: archive.id,
      idSalle: archive.idSalle,
      idCoffre: archive.idCoffre,
      isDelete: archive.isDelete,
      fichier: archive.fichier,
      createdAt: archive.createdAt,
      updatedAt: archive.updatedAt,
      salle: salle || null,
      coffre: coffre ? {
        ...coffre,
        placesDisponibles: coffre.tailleMaximale - coffre.nombrePlaceActuelle,
      } : null,
      courrier: courriers.length > 0 ? courriers[0] : null,
      transmission: transmissions.length > 0 ? transmissions[0] : null,
      courrierDepart: courriersDepart.length > 0 ? courriersDepart[0] : null,
    };

    return this.responseFormatter.success(
      response,
      'Détails de l\'archive',
      'Archive récupérée avec succès.',
    );
  }

  // ✏️ Mettre à jour une archive
  async update(id: number, updateArchiveDto: UpdateArchiveDto) {
    // Vérifier si l'archive existe
    const existingArchive = await this.prismaService.archive.findUnique({
      where: { id },
    });

    if (!existingArchive) {
      throw new NotFoundException('Archive non trouvée.');
    }

    const { idSalle, idCoffre, idCourriers, idTransmissions, idCourriersDepart } = updateArchiveDto;

    // Si le coffre est modifié, vérifier les capacités
    if (idCoffre && idCoffre !== existingArchive.idCoffre) {
      // Vérifier que le nouveau coffre existe et est actif
      const newCoffre = await this.prismaService.coffre.findFirst({
        where: {
          id: idCoffre,
          isDelete: false,
          isActive: true,
        },
      });

      if (!newCoffre) {
        throw new NotFoundException('Nouveau coffre non trouvé ou inactif.');
      }

      // Vérifier la capacité maximale du nouveau coffre
      if (newCoffre.nombrePlaceActuelle >= newCoffre.tailleMaximale) {
        throw new BadRequestException('Le coffre a atteint sa capacité maximale.');
      }

      // Transaction: décrémenter ancien coffre, incrémenter nouveau coffre, mettre à jour archive
      const result = await this.prismaService.$transaction(async (prisma) => {
        // Décrémenter l'ancien coffre
        await prisma.coffre.update({
          where: { id: existingArchive.idCoffre },
          data: {
            nombrePlaceActuelle: {
              decrement: 1,
            },
          },
        });

        // Incrémenter le nouveau coffre
        await prisma.coffre.update({
          where: { id: idCoffre },
          data: {
            nombrePlaceActuelle: {
              increment: 1,
            },
          },
        });

        // Mettre à jour l'archive
        const dataToUpdate: any = {};
        if (idCourriers !== undefined) dataToUpdate.idCourrier = idCourriers;
        if (idTransmissions !== undefined) dataToUpdate.idTransmission = idTransmissions;
        if (idCourriersDepart !== undefined) dataToUpdate.idCourrierDepart = idCourriersDepart;
        if (idSalle !== undefined) dataToUpdate.idSalle = idSalle;
        if (idCoffre !== undefined) dataToUpdate.idCoffre = idCoffre;

        const updatedArchive = await prisma.archive.update({
          where: { id },
          data: dataToUpdate,
        });

        return updatedArchive;
      });

      return this.responseFormatter.success(
        result,
        'Mise à jour archive',
        'Archive mise à jour avec succès (coffre changé).',
      );
    } else {
      // Mise à jour simple sans changement de coffre
      const dataToUpdate: any = {};
      if (idCourriers !== undefined) dataToUpdate.idCourrier = idCourriers;
      if (idTransmissions !== undefined) dataToUpdate.idTransmission = idTransmissions;
      if (idCourriersDepart !== undefined) dataToUpdate.idCourrierDepart = idCourriersDepart;
      if (idSalle !== undefined) dataToUpdate.idSalle = idSalle;

      const updatedArchive = await this.prismaService.archive.update({
        where: { id },
        data: dataToUpdate,
      });

      return this.responseFormatter.success(
        updatedArchive,
        'Mise à jour archive',
        'Archive mise à jour avec succès.',
      );
    }
  }

  // 🗑️ Suppression logique (soft delete)
  async softDelete(id: number) {
    const archive = await this.prismaService.archive.findUnique({
      where: { id },
    });

    if (!archive) {
      throw new NotFoundException('Archive non trouvée.');
    }

    if (archive.isDelete) {
      throw new BadRequestException('Cette archive est déjà supprimée.');
    }

    // Transaction: marquer comme supprimée et décrémenter le coffre
    const result = await this.prismaService.$transaction(async (prisma) => {
      // Marquer l'archive comme supprimée
      const deletedArchive = await prisma.archive.update({
        where: { id },
        data: { isDelete: true },
      });

      // Décrémenter le nombre de places dans le coffre
      await prisma.coffre.update({
        where: { id: archive.idCoffre },
        data: {
          nombrePlaceActuelle: {
            decrement: 1,
          },
        },
      });

      return deletedArchive;
    });

    return this.responseFormatter.success(
      { id: result.id },
      'Suppression logique',
      'Archive supprimée logiquement avec succès. Place libérée dans le coffre.',
    );
  }

  // 🗑️ Suppression définitive (hard delete)
  async hardDelete(id: number) {
    const archive = await this.prismaService.archive.findUnique({
      where: { id },
    });

    if (!archive) {
      throw new NotFoundException('Archive non trouvée.');
    }

    // Transaction: supprimer l'archive et décrémenter le coffre
    await this.prismaService.$transaction(async (prisma) => {
      // Supprimer l'archive
      await prisma.archive.delete({
        where: { id },
      });

      // Décrémenter le nombre de places dans le coffre (seulement si l'archive n'était pas déjà supprimée logiquement)
      if (!archive.isDelete) {
        await prisma.coffre.update({
          where: { id: archive.idCoffre },
          data: {
            nombrePlaceActuelle: {
              decrement: 1,
            },
          },
        });
      }
    });

    return this.responseFormatter.success(
      { id },
      'Suppression définitive',
      'Archive supprimée définitivement avec succès. Place libérée dans le coffre.',
    );
  }

  // 🗑️ Vider plusieurs coffres
  async viderCoffres(viderCoffresDto: ViderCoffresDto, fichier: Express.Multer.File, idUser: number) {
    const { idCoffres } = viderCoffresDto;

    if (!fichier) {
      throw new BadRequestException('Le fichier justificatif est obligatoire.');
    }

    // Vérifier que l'utilisateur existe
    const user = await this.prismaService.user.findUnique({
      where: { id: idUser },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // Vérifier que tous les coffres existent
    const coffres = await this.prismaService.coffre.findMany({
      where: {
        id: { in: idCoffres },
        isDelete: false,
      },
      include: {
        salle: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    if (coffres.length !== idCoffres.length) {
      throw new NotFoundException('Un ou plusieurs coffres sont introuvables.');
    }

    // Générer le chemin du fichier
    const timestamp = Date.now();
    const fileName = `${timestamp}-${fichier.originalname}`;
    const filePath = path.join('public', 'archive', fileName);
    const relativePath = `archive/${fileName}`;

    // Créer le dossier s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'archive');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sauvegarder le fichier
    const fullPath = path.join(process.cwd(), filePath);
    fs.writeFileSync(fullPath, fichier.buffer);

    // Transaction pour vider tous les coffres
    const result = await this.prismaService.$transaction(async (prisma) => {
      const stats = {
        totalCoffres: coffres.length,
        totalArchivesVidees: 0,
        totalCourriersTransferes: 0,
        totalTransmissionsTransferees: 0,
        totalCourriersDepartTransferes: 0,
        coffresVides: [] as any[],
      };

      const dateVidage = new Date();

      for (const coffre of coffres) {
        // Récupérer toutes les archives actives du coffre
        const archives = await prisma.archive.findMany({
          where: {
            idCoffre: coffre.id,
            isDelete: false,
          },
        });

        let archivesVidees = 0;

        // Pour chaque archive
        for (const archive of archives) {
          const idCourriers = (archive.idCourrier as any as number[]) || [];
          const idTransmissions = (archive.idTransmission as any as number[]) || [];
          const idCourriersDepart = (archive.idCourrierDepart as any as number[]) || [];

          // Données de vidage
          const viderParData = {
            idUser: user.id,
            nomComplet: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            date: dateVidage.toISOString(),
            salle: coffre.salle?.nom || '',
            coffre: coffre.nom,
            fichier: relativePath,
          };

          // Mettre à jour les courriers
          if (idCourriers.length > 0) {
            await prisma.courrier.updateMany({
              where: { id: { in: idCourriers } },
              data: {
                statutArchive: 'transféré',
                viderPar: viderParData,
              },
            });
            stats.totalCourriersTransferes += idCourriers.length;
          }

          // Mettre à jour les transmissions
          if (idTransmissions.length > 0) {
            await prisma.transmission.updateMany({
              where: { id: { in: idTransmissions } },
              data: {
                statutArchive: 'transféré',
                viderPar: viderParData,
              },
            });
            stats.totalTransmissionsTransferees += idTransmissions.length;
          }

          // Mettre à jour les courriers départ
          if (idCourriersDepart.length > 0) {
            await prisma.courrierDepart.updateMany({
              where: { id: { in: idCourriersDepart } },
              data: {
                statutArchive: 'transféré',
                viderPar: viderParData,
              },
            });
            stats.totalCourriersDepartTransferes += idCourriersDepart.length;
          }

          // Vider l'archive (tableaux à vide)
          await prisma.archive.update({
            where: { id: archive.id },
            data: {
              idCourrier: [],
              idTransmission: [],
              idCourrierDepart: [],
              fichier: relativePath,
            },
          });

          archivesVidees++;
        }

        stats.totalArchivesVidees += archivesVidees;

        // Réinitialiser le nombre de places du coffre à 0
        await prisma.coffre.update({
          where: { id: coffre.id },
          data: {
            nombrePlaceActuelle: 0,
          },
        });

        stats.coffresVides.push({
          id: coffre.id,
          nom: coffre.nom,
          salle: coffre.salle?.nom || '',
          archivesVidees,
        });
      }

      return stats;
    });

    return this.responseFormatter.success(
      {
        ...result,
        fichierJustificatif: relativePath,
        viderPar: {
          id: user.id,
          nomComplet: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        },
      },
      'Vidage des coffres',
      `${result.totalCoffres} coffre(s) vidé(s) avec succès. ${result.totalArchivesVidees} archive(s) vidée(s). ${result.totalCourriersTransferes} courrier(s), ${result.totalTransmissionsTransferees} transmission(s), ${result.totalCourriersDepartTransferes} courrier(s) départ transférés.`,
    );
  }

  // 📤 Retirer des éléments d'archives
  async retirerArchives(retirerArchivesDto: RetirerArchivesDto, fichier: Express.Multer.File, idUser: number) {
    const { items } = retirerArchivesDto;

    if (!fichier) {
      throw new BadRequestException('Le fichier justificatif est obligatoire.');
    }

    // Vérifier que l'utilisateur existe
    const user = await this.prismaService.user.findUnique({
      where: { id: idUser },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // Générer le chemin du fichier
    const timestamp = Date.now();
    const fileName = `${timestamp}-${fichier.originalname}`;
    const filePath = path.join('public', 'archive', fileName);
    const relativePath = `archive/${fileName}`;

    // Créer le dossier s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'archive');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sauvegarder le fichier
    const fullPath = path.join(process.cwd(), filePath);
    fs.writeFileSync(fullPath, fichier.buffer);

    // Transaction pour retirer les éléments
    const result = await this.prismaService.$transaction(async (prisma) => {
      const stats = {
        totalCoffres: items.length,
        totalArchivesModifiees: 0,
        totalArchivesVidees: 0,
        totalCourriersRetires: 0,
        totalTransmissionsRetirees: 0,
        totalCourriersDepartRetires: 0,
        coffresTraites: [] as any[],
      };

      const dateRetrait = new Date();

      for (const item of items) {
        const { coffreId, courrierIds = [], transmissionIds = [], courrierDepartIds = [] } = item;

        // Vérifier que le coffre existe
        const coffre = await prisma.coffre.findFirst({
          where: { id: coffreId, isDelete: false },
          include: {
            salle: {
              select: {
                id: true,
                nom: true,
              },
            },
          },
        });

        if (!coffre) {
          continue; // Ignorer les coffres inexistants
        }

        // Récupérer toutes les archives du coffre
        const archives = await prisma.archive.findMany({
          where: {
            idCoffre: coffreId,
            isDelete: false,
          },
        });

        let archivesModifiees = 0;
        let archivesVidees = 0;

        // Données de retrait
        const retirerParData = {
          idUser: user.id,
          nomComplet: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          date: dateRetrait.toISOString(),
          salle: coffre.salle?.nom || '',
          coffre: coffre.nom,
          fichier: relativePath,
        };

        // Pour chaque archive
        for (const archive of archives) {
          const archiveIdCourriers = (archive.idCourrier as any as number[]) || [];
          const archiveIdTransmissions = (archive.idTransmission as any as number[]) || [];
          const archiveIdCourriersDepart = (archive.idCourrierDepart as any as number[]) || [];

          // Filtrer les IDs à retirer
          const courriersARetirer = archiveIdCourriers.filter(id => courrierIds.includes(id));
          const transmissionsARetirer = archiveIdTransmissions.filter(id => transmissionIds.includes(id));
          const courriersDepartARetirer = archiveIdCourriersDepart.filter(id => courrierDepartIds.includes(id));

          // Vérifier si cette archive contient des éléments à retirer
          if (courriersARetirer.length === 0 && transmissionsARetirer.length === 0 && courriersDepartARetirer.length === 0) {
            continue;
          }

          // Nouveaux tableaux sans les éléments retirés
          const nouveauxCourriers = archiveIdCourriers.filter(id => !courrierIds.includes(id));
          const nouvellesTransmissions = archiveIdTransmissions.filter(id => !transmissionIds.includes(id));
          const nouveauxCourriersDpart = archiveIdCourriersDepart.filter(id => !courrierDepartIds.includes(id));

          // Mettre à jour les courriers retirés
          if (courriersARetirer.length > 0) {
            await prisma.courrier.updateMany({
              where: { id: { in: courriersARetirer } },
              data: {
                statutArchive: 'transféré',
                viderPar: retirerParData,
              },
            });
            stats.totalCourriersRetires += courriersARetirer.length;
          }

          // Mettre à jour les transmissions retirées
          if (transmissionsARetirer.length > 0) {
            await prisma.transmission.updateMany({
              where: { id: { in: transmissionsARetirer } },
              data: {
                statutArchive: 'transféré',
                viderPar: retirerParData,
              },
            });
            stats.totalTransmissionsRetirees += transmissionsARetirer.length;
          }

          // Mettre à jour les courriers départ retirés
          if (courriersDepartARetirer.length > 0) {
            await prisma.courrierDepart.updateMany({
              where: { id: { in: courriersDepartARetirer } },
              data: {
                statutArchive: 'transféré',
                viderPar: retirerParData,
              },
            });
            stats.totalCourriersDepartRetires += courriersDepartARetirer.length;
          }

          // Mettre à jour l'archive
          await prisma.archive.update({
            where: { id: archive.id },
            data: {
              idCourrier: nouveauxCourriers,
              idTransmission: nouvellesTransmissions,
              idCourrierDepart: nouveauxCourriersDpart,
              fichier: relativePath,
            },
          });

          archivesModifiees++;

          // Si l'archive est complètement vide, décrémenter le coffre
          if (nouveauxCourriers.length === 0 && nouvellesTransmissions.length === 0 && nouveauxCourriersDpart.length === 0) {
            archivesVidees++;
          }
        }

        // Décrémenter le coffre si des archives ont été vidées
        if (archivesVidees > 0) {
          await prisma.coffre.update({
            where: { id: coffreId },
            data: {
              nombrePlaceActuelle: {
                decrement: archivesVidees,
              },
            },
          });
        }

        stats.totalArchivesModifiees += archivesModifiees;
        stats.totalArchivesVidees += archivesVidees;

        stats.coffresTraites.push({
          id: coffre.id,
          nom: coffre.nom,
          salle: coffre.salle?.nom || '',
          archivesModifiees,
          archivesVidees,
        });
      }

      return stats;
    });

    return this.responseFormatter.success(
      {
        ...result,
        fichierJustificatif: relativePath,
        retirerPar: {
          id: user.id,
          nomComplet: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        },
      },
      'Retrait des archives',
      `${result.totalCoffres} coffre(s) traité(s) avec succès. ${result.totalArchivesModifiees} archive(s) modifiée(s), ${result.totalArchivesVidees} archive(s) vidée(s). ${result.totalCourriersRetires} courrier(s), ${result.totalTransmissionsRetirees} transmission(s), ${result.totalCourriersDepartRetires} courrier(s) départ retirés.`,
    );
  }

  // 📋 Fonction pour enrichir le champ viderPar
  private async enrichirViderPar(viderPar: any) {
    if (!viderPar || typeof viderPar !== 'object') {
      return null;
    }

    const userId = viderPar.idUser;
    if (!userId) {
      return viderPar;
    }

    // Récupérer les informations de l'utilisateur
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        idService: true,
      },
    });

    if (!user) {
      return viderPar;
    }

    // Récupérer le service
    let service: { id: number; nom: string } | null = null;
    if (user.idService) {
      const foundService = await this.prismaService.service.findUnique({
        where: { id: user.idService },
        select: {
          id: true,
          nom: true,
        },
      });
      if (foundService) {
        service = foundService;
      }
    }

    // Récupérer la salle et le coffre si les noms sont stockés
    let salleInfo: { id: number; nom: string } | null = null;
    let coffreInfo: { id: number; nom: string } | null = null;

    if (viderPar.salle) {
      const salle = await this.prismaService.salle.findFirst({
        where: { nom: viderPar.salle, isDelete: false },
        select: { id: true, nom: true },
      });
      if (salle) {
        salleInfo = salle;
      }
    }

    if (viderPar.coffre && salleInfo) {
      const coffre = await this.prismaService.coffre.findFirst({
        where: { 
          nom: viderPar.coffre, 
          idSalle: salleInfo.id,
          isDelete: false 
        },
        select: { id: true, nom: true },
      });
      if (coffre) {
        coffreInfo = coffre;
      }
    }

    return {
      id: user.id,
      fullname: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      nom: user.lastName || '',
      prenom: user.firstName || '',
      email: user.email,
      service: service,
      date: viderPar.date,
      salle: salleInfo,
      coffre: coffreInfo,
      fichierJustificatif: viderPar.fichier || null,
    };
  }

  // 📋 Liste des éléments archivés puis transférés (vidés)
  async findArchivesTransferes(query: ArchivesTransferesQueryDto) {
    const { page = 1, limit = 10, type } = query;

    // Critères de recherche communs
    const whereClause = {
      isArchive: true,
      statutArchive: 'transféré',
      isDelete: false,
    };

    let allItems: any[] = [];

    // Récupérer les courriers transférés
    if (!type || type === 'courrier') {
      const courriers = await this.prismaService.courrier.findMany({
        where: whereClause,
        select: {
          id: true,
          numero: true,
          objet: true,
          createdAt: true,
          isArchive: true,
          statutArchive: true,
          viderPar: true,
        },
      });

      const courriersFormatted = courriers.map(c => ({
        id: c.id,
        type: 'courrier',
        numero: c.numero,
        objet: c.objet,
        document: null,
        dateCreation: c.createdAt,
        isArchive: c.isArchive,
        statutArchive: c.statutArchive,
        dateArchivage: null,
        viderPar: c.viderPar,
      }));

      allItems.push(...courriersFormatted);
    }

    // Récupérer les transmissions transférées
    if (!type || type === 'transmission') {
      const transmissions = await this.prismaService.transmission.findMany({
        where: whereClause,
        select: {
          id: true,
          instruction: true,
          createdAt: true,
          isArchive: true,
          statutArchive: true,
          viderPar: true,
        },
      });

      const transmissionsFormatted = transmissions.map(t => ({
        id: t.id,
        type: 'transmission',
        numero: `T-${t.id}`,
        objet: t.instruction,
        document: null,
        dateCreation: t.createdAt,
        isArchive: t.isArchive,
        statutArchive: t.statutArchive,
        dateArchivage: null,
        viderPar: t.viderPar,
      }));

      allItems.push(...transmissionsFormatted);
    }

    // Récupérer les courriers départ transférés
    if (!type || type === 'courrier depart') {
      const courriersDepart = await this.prismaService.courrierDepart.findMany({
        where: whereClause,
        select: {
          id: true,
          numeroReference: true,
          document: true,
          createdAt: true,
          isArchive: true,
          statutArchive: true,
          viderPar: true,
        },
      });

      const courriersDepartFormatted = courriersDepart.map(cd => ({
        id: cd.id,
        type: 'courrier depart',
        numero: cd.numeroReference,
        objet: null,
        document: cd.document,
        dateCreation: cd.createdAt,
        isArchive: cd.isArchive,
        statutArchive: cd.statutArchive,
        dateArchivage: null,
        viderPar: cd.viderPar,
      }));

      allItems.push(...courriersDepartFormatted);
    }

    // Trier par dateCreation (plus récents d'abord)
    allItems.sort((a, b) => {
      const dateA = new Date(a.dateCreation).getTime();
      const dateB = new Date(b.dateCreation).getTime();
      return dateB - dateA;
    });

    // Calculer les totaux avant pagination
    const total = allItems.length;
    const totalCourriers = allItems.filter(item => item.type === 'courrier').length;
    const totalTransmissions = allItems.filter(item => item.type === 'transmission').length;
    const totalCourriersDepart = allItems.filter(item => item.type === 'courrier depart').length;

    // Pagination en mémoire
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = allItems.slice(startIndex, endIndex);

    // Enrichir le champ viderPar pour chaque élément
    const itemsWithEnrichedViderPar = await Promise.all(
      paginatedItems.map(async (item) => {
        const enrichedViderPar = await this.enrichirViderPar(item.viderPar);
        return {
          ...item,
          viderPar: enrichedViderPar,
        };
      }),
    );

    // Préparer la réponse paginée
    const totalPages = Math.ceil(total / limit);
    const result = {
      total,
      totalCourriers,
      totalTransmissions,
      totalCourriersDepart,
      page,
      limit,
      totalPages,
      data: itemsWithEnrichedViderPar,
    };

    return this.responseFormatter.success(
      result,
      'Liste des éléments transférés',
      `${total} élément(s) transféré(s) trouvé(s) (${totalCourriers} courrier(s), ${totalTransmissions} transmission(s), ${totalCourriersDepart} courrier(s) départ).`,
    );
  }

  // 📤 Désarchiver des éléments
  async unarchive(unarchiveDto: UnarchiveDto, userId: number) {
    const { idCourriers = [], idTransmissions = [], idCourriersDepart = [], idSalle, idCoffre } = unarchiveDto;

    // Vérifier qu'au moins un type d'élément est fourni
    if (idCourriers.length === 0 && idTransmissions.length === 0 && idCourriersDepart.length === 0) {
      throw new BadRequestException('Au moins un type d\'élément doit être fourni pour le désarchivage.');
    }

    // Vérifier que la salle existe, n'est pas supprimée et est active
    const salle = await this.prismaService.salle.findFirst({
      where: { 
        id: idSalle, 
        isDelete: false,
        isActive: true,
      },
    });

    if (!salle) {
      throw new BadRequestException(`La salle avec l'ID ${idSalle} n'existe pas, est supprimée ou inactive.`);
    }

    // Vérifier que le coffre existe, n'est pas supprimé et est actif
    const coffre = await this.prismaService.coffre.findFirst({
      where: {
        id: idCoffre,
        isDelete: false,
        isActive: true,
      },
    });

    if (!coffre) {
      throw new NotFoundException('Coffre non trouvé, supprimé ou inactif.');
    }

    // Vérifier que le coffre appartient bien à la salle
    if (coffre.idSalle !== idSalle) {
      throw new BadRequestException(`Le coffre avec l'ID ${idCoffre} n'appartient pas à la salle avec l'ID ${idSalle}.`);
    }

    // Fonction utilitaire pour déterminer le statut selon les règles métier
    const determinerStatut = (transmission: any) => {
      if (transmission.isArchive) return 'Archivé';
      if (transmission.isinstance) return 'En instance';
      if (transmission.accuseReception) return 'Reçu';
      return 'En traitement';
    };

    // Effectuer le désarchivage et mettre à jour les entités (transaction)
    const result = await this.prismaService.$transaction(async (prisma) => {
      let courriersDesarchives = 0;
      let transmissionsDesarchivees = 0;
      let courriersDeparsDesarchives = 0;
      let transmissionsLieesDesarchivees = 0;
      let courriersParentsDesarchives = 0;

      // Désarchiver les courriers et leurs transmissions liées
      if (idCourriers.length > 0) {
        // Récupérer les détails des courriers pour déterminer le statut
        const courriers = await prisma.courrier.findMany({
          where: { id: { in: idCourriers }, isArchive: true },
          include: {
            transmissions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        // Mettre à jour chaque courrier et ses transmissions liées
        for (const courrier of courriers) {
          const derniereTrans = courrier.transmissions[0];
          let nouveauStatut = 'En traitement';

          if (derniereTrans) {
            nouveauStatut = determinerStatut(derniereTrans);
          }

          // Désarchiver le courrier
          await prisma.courrier.update({
            where: { id: courrier.id },
            data: {
              statut: nouveauStatut,
              isArchive: false,
              statutArchive: null,
            },
          });

          // Désarchiver automatiquement toutes les transmissions liées qui sont archivées
          const transmissionsArchivees = courrier.transmissions.filter(t => t.isArchive);
          
          for (const transmission of transmissionsArchivees) {
            const statutTransmission = determinerStatut(transmission);
            
            await prisma.transmission.update({
              where: { id: transmission.id },
              data: {
                statut: statutTransmission,
                isArchive: false,
                statutArchive: null,
              },
            });
            
            transmissionsLieesDesarchivees++;
          }
        }

        courriersDesarchives = courriers.length;
      }

      // Récupérer les IDs des transmissions déjà désarchivées par les courriers
      const transmissionsDejaDesarchivees = new Set<number>();
      
      if (idCourriers.length > 0) {
        const transmissionsDejaCouvertes = await prisma.transmission.findMany({
          where: { 
            idCourrier: { in: idCourriers },
            isArchive: false // Celles qui ont été désarchivées
          },
          select: { id: true }
        });
        
        transmissionsDejaCouvertes.forEach(t => transmissionsDejaDesarchivees.add(t.id));
      }

      // Désarchiver les transmissions explicites et gérer les courriers parents
      if (idTransmissions.length > 0) {
        const transmissionsExplicites = idTransmissions.filter(id => 
          !transmissionsDejaDesarchivees.has(id)
        );
        
        if (transmissionsExplicites.length > 0) {
          const transmissions = await prisma.transmission.findMany({
            where: { id: { in: transmissionsExplicites }, isArchive: true },
            include: { courrier: true }
          });

          const courriersAVerifier = new Set<number>();

          // Désarchiver chaque transmission et collecter les courriers parents
          for (const transmission of transmissions) {
            const nouveauStatut = determinerStatut(transmission);

            await prisma.transmission.update({
              where: { id: transmission.id },
              data: {
                statut: nouveauStatut,
                isArchive: false,
                statutArchive: null,
              },
            });

            // Collecter le courrier parent pour vérification
            if (transmission.idCourrier && transmission.courrier?.isArchive) {
              courriersAVerifier.add(transmission.idCourrier);
            }
          }

          // Vérifier chaque courrier parent : le désarchiver seulement si aucune autre transmission n'est archivée
          for (const idCourrierParent of courriersAVerifier) {
            // Vérifier s'il reste des transmissions archivées pour ce courrier
            const transmissionsArchiveesRestantes = await prisma.transmission.findMany({
              where: { 
                idCourrier: idCourrierParent,
                isArchive: true
              }
            });

            // Si aucune transmission archivée ne reste, désarchiver le courrier parent
            if (transmissionsArchiveesRestantes.length === 0) {
              const courrier = await prisma.courrier.findUnique({
                where: { id: idCourrierParent },
                include: {
                  transmissions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                  }
                }
              });

              if (courrier) {
                const derniereTrans = courrier.transmissions[0];
                const nouveauStatut = derniereTrans ? determinerStatut(derniereTrans) : 'En traitement';

                await prisma.courrier.update({
                  where: { id: idCourrierParent },
                  data: {
                    statut: nouveauStatut,
                    isArchive: false,
                    statutArchive: null,
                  },
                });

                courriersParentsDesarchives++;
              }
            }
          }

          transmissionsDesarchivees = transmissions.length;
        }
      }

      // Désarchiver les courriers départ
      if (idCourriersDepart.length > 0) {
        const courriersDepart = await prisma.courrierDepart.findMany({
          where: { id: { in: idCourriersDepart }, isArchive: true },
        });

        await prisma.courrierDepart.updateMany({
          where: { id: { in: idCourriersDepart }, isArchive: true },
          data: {
            isArchive: false,
            statutArchive: null,
          },
        });

        courriersDeparsDesarchives = courriersDepart.length;
      }

      // Décrémenter le nombre de places occupées dans le coffre
      const totalElementsDesarchives = courriersDesarchives + transmissionsDesarchivees + transmissionsLieesDesarchivees + courriersDeparsDesarchives + courriersParentsDesarchives;
      
      if (totalElementsDesarchives > 0) {
        await prisma.coffre.update({
          where: { id: idCoffre },
          data: {
            nombrePlaceActuelle: Math.max(0, coffre.nombrePlaceActuelle - totalElementsDesarchives),
          },
        });
      }

      // Supprimer les enregistrements d'archivage
      const archivesToDelete: any[] = [];

      if (idCourriers.length > 0) {
        archivesToDelete.push({
          idCourrier: { in: idCourriers }
        });
      }

      if (idTransmissions.length > 0) {
        archivesToDelete.push({
          idTransmission: { in: idTransmissions }
        });
      }

      if (idCourriersDepart.length > 0) {
        archivesToDelete.push({
          idCourrierDepart: { in: idCourriersDepart }
        });
      }

      // Supprimer les archives avec OR condition
      if (archivesToDelete.length > 0) {
        await prisma.archive.deleteMany({
          where: {
            OR: archivesToDelete,
            idSalle,
            idCoffre,
          },
        });
      }

      return {
        courriersDesarchives,
        transmissionsDesarchivees,
        transmissionsLieesDesarchivees,
        courriersParentsDesarchives,
        courriersDeparsDesarchives,
        totalElementsDesarchives,
      };
    });

    // Message de succès
    const messages: string[] = [];
    if (result.courriersDesarchives > 0) {
      messages.push(`${result.courriersDesarchives} courrier(s)`);
      if (result.transmissionsLieesDesarchivees > 0) {
        messages.push(`${result.transmissionsLieesDesarchivees} transmission(s) liée(s) automatiquement`);
      }
    }
    if (result.transmissionsDesarchivees > 0) {
      messages.push(`${result.transmissionsDesarchivees} transmission(s) explicite(s)`);
      if (result.courriersParentsDesarchives > 0) {
        messages.push(`${result.courriersParentsDesarchives} courrier(s) parent(s) automatiquement`);
      }
    }
    if (result.courriersDeparsDesarchives > 0) messages.push(`${result.courriersDeparsDesarchives} courrier(s) départ`);

    return this.responseFormatter.success(
      result,
      'Désarchivage réussi',
      `${result.totalElementsDesarchives} élément(s) désarchivé(s) avec succès: ${messages.join(', ')}.`,
    );
  }
}
