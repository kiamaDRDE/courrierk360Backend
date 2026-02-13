// src/archive/archive.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArchiveService } from './archive.service';
import { CreateArchiveDto } from './dto/create-archive.dto';
import { UpdateArchiveDto } from './dto/update-archive.dto';
import { ArchiveQueryDto } from './dto/archive-query.dto';
import { ViderCoffresDto } from './dto/vider-coffres.dto';
import { RetirerArchivesDto } from './dto/retirer-archives.dto';
import { ArchivesTransferesQueryDto } from './dto/archives-transferes-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Archive')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('archive')
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  // 📝 Créer une archive
  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle archive',
    description: 'Créer une archive avec vérification de la capacité du coffre. Vérifie que la salle et le coffre existent, sont actifs et que le coffre appartient à la salle. Met automatiquement à jour les courriers, transmissions et courriers départ (statut archivé, isArchive = true, statutArchive = non transféré). Incrémente automatiquement le nombre de places occupées dans le coffre.',
  })
  @ApiResponse({
    status: 201,
    description: 'Archive créée avec succès.',
    schema: {
      example: {
        success: true,
        message: 'Archive créée avec succès. Coffre: 15/20 places.',
        title: 'Création archive',
        data: {
          id: 1,
          idCourrier: [1, 2, 3],
          idTransmission: [4, 5],
          idCourrierDepart: [6],
          idSalle: 1,
          idCoffre: 1,
          isDelete: false,
          fichier: '',
          createdAt: '2025-01-13T10:00:00.000Z',
          updatedAt: '2025-01-13T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Le coffre a atteint sa capacité maximale ou le coffre n\'appartient pas à la salle.',
    schema: {
      example: {
        success: false,
        message: 'Le coffre a atteint sa capacité maximale.',
        title: 'Erreur',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Coffre ou salle non trouvé, supprimé ou inactif.',
    schema: {
      example: {
        success: false,
        message: 'Coffre non trouvé, supprimé ou inactif.',
        title: 'Erreur',
      },
    },
  })
  create(@Body() createArchiveDto: CreateArchiveDto) {
    return this.archiveService.create(createArchiveDto);
  }

  // 📋 Liste de toutes les archives avec filtres et pagination
  @Get()
  @ApiOperation({
    summary: 'Liste de toutes les archives groupées par salle et coffre',
    description: 'Récupère toutes les archives groupées par salle puis par coffre, avec les détails des courriers, transmissions et courriers départ.',
  })
  @ApiQuery({ name: 'idSalle', required: false, type: Number, description: 'Filtrer par ID de salle', example: 1 })
  @ApiQuery({ name: 'idCoffre', required: false, type: Number, description: 'Filtrer par ID de coffre', example: 1 })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrer par statut actif du coffre', example: true })
  @ApiQuery({ name: 'isDelete', required: false, type: Boolean, description: 'Filtrer par statut de suppression (défaut: false)', example: false })
  @ApiResponse({
    status: 200,
    description: 'Liste des archives récupérée avec succès.',
    schema: {
      example: {
        success: true,
        message: '2 salle(s) avec 5 coffre(s) récupérée(s) avec succès.',
        title: 'Liste des archives',
        data: {
          totalSalles: 2,
          totalCoffres: 5,
          data: [
            {
              salle: {
                id: 1,
                nom: 'Salle A',
                isActive: true,
              },
              totalArchives: 50,
              totalCoffres: 3,
              coffres: [
                {
                  coffre: {
                    id: 1,
                    nom: 'Coffre A1',
                    nombrePlaceActuelle: 15,
                    tailleMaximale: 20,
                    isActive: true,
                  },
                  totalArchives: 15,
                  archives: [
                    {
                      id: 1,
                      idSalle: 1,
                      idCoffre: 1,
                      createdAt: '2026-02-10T16:45:24.438Z',
                      courrier: {
                        id: 1,
                        numero: 'CRR-2026-001',
                        reference: 'REF-001',
                        objet: 'Demande d\'information',
                        dateArrivee: '2026-02-10T10:00:00.000Z',
                        priorite: 'Haute',
                        statut: 'En cours',
                      },
                      transmission: {
                        id: 4,
                        idCourrier: 1,
                        instruction: 'Traiter en priorité',
                        dateInstruction: '2026-02-10T11:00:00.000Z',
                        statut: 'Transmis',
                      },
                      courrierDepart: {
                        id: 6,
                        numeroReference: 'REF-DEP-001',
                        numeroActe: 'ORD-001',
                        typeCourrier: 'Réponse',
                        dateSignature: '2026-02-10T15:00:00.000Z',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
  })
  findAll(@Query() query: ArchiveQueryDto) {
    return this.archiveService.findAll(query);
  }

  // 🔍 Récupérer une archive par ID
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une archive par ID',
    description: 'Récupère les détails d\'une archive spécifique par son ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Archive récupérée avec succès.',
    schema: {
      example: {
        success: true,
        message: 'Archive récupérée avec succès.',
        title: 'Détails de l\'archive',
        data: {
          id: 1,
          idSalle: 1,
          idCoffre: 1,
          isDelete: false,
          fichier: '',
          createdAt: '2026-02-10T17:24:53.079Z',
          updatedAt: '2026-02-10T17:24:53.079Z',
          salle: {
            id: 1,
            nom: 'Salle A',
            isActive: true,
          },
          coffre: {
            id: 1,
            nom: 'Coffre A1',
            nombrePlaceActuelle: 15,
            tailleMaximale: 20,
            placesDisponibles: 5,
            isActive: true,
          },
          courrier: {
            id: 1,
            numero: 'CRR-2026-001',
            reference: 'REF-001',
            objet: 'Demande d\'information',
            dateArrivee: '2026-02-10T10:00:00.000Z',
            priorite: 'Haute',
            statut: 'En cours',
          },
          transmission: {
            id: 4,
            idCourrier: 1,
            instruction: 'Traiter en priorité',
            statut: 'Transmis',
          },
          courrierDepart: {
            id: 6,
            numeroReference: 'REF-DEP-001',
            numeroActe: 'ORD-001',
            typeCourrier: 'Réponse',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Archive non trouvée.',
    schema: {
      example: {
        success: false,
        message: 'Archive non trouvée.',
        title: 'Erreur',
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.archiveService.findOne(id);
  }

  // ✏️ Mettre à jour une archive
  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour une archive',
    description: 'Met à jour une archive. Si le coffre est modifié, la capacité des coffres sera automatiquement ajustée (décrémentation de l\'ancien, incrémentation du nouveau).',
  })
  @ApiResponse({
    status: 200,
    description: 'Archive mise à jour avec succès.',
    schema: {
      example: {
        success: true,
        message: 'Archive mise à jour avec succès (coffre changé).',
        title: 'Mise à jour archive',
        data: {
          id: 1,
          idCourrier: [1, 2, 3, 11],
          idTransmission: [4, 5],
          idCourrierDepart: [6],
          idSalle: 1,
          idCoffre: 2,
          isDelete: false,
          createdAt: '2025-01-13T10:00:00.000Z',
          updatedAt: '2025-01-13T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Le coffre a atteint sa capacité maximale.',
    schema: {
      example: {
        success: false,
        message: 'Le coffre a atteint sa capacité maximale.',
        title: 'Erreur',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Archive ou coffre non trouvé.',
    schema: {
      example: {
        success: false,
        message: 'Archive non trouvée.',
        title: 'Erreur',
      },
    },
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateArchiveDto: UpdateArchiveDto) {
    return this.archiveService.update(id, updateArchiveDto);
  }

  // 🗑️ Suppression logique (soft delete)
  @Delete(':id/soft')
  @ApiOperation({
    summary: 'Suppression logique d\'une archive',
    description: 'Marque une archive comme supprimée (soft delete) et décrémente automatiquement le nombre de places occupées dans le coffre.',
  })
  @ApiResponse({
    status: 200,
    description: 'Archive supprimée logiquement avec succès.',
    schema: {
      example: {
        success: true,
        message: 'Archive supprimée logiquement avec succès. Place libérée dans le coffre.',
        title: 'Suppression logique',
        data: {
          id: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cette archive est déjà supprimée.',
    schema: {
      example: {
        success: false,
        message: 'Cette archive est déjà supprimée.',
        title: 'Erreur',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Archive non trouvée.',
    schema: {
      example: {
        success: false,
        message: 'Archive non trouvée.',
        title: 'Erreur',
      },
    },
  })
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.archiveService.softDelete(id);
  }

  // 🗑️ Suppression définitive (hard delete)
  @Delete(':id/hard')
  @ApiOperation({
    summary: 'Suppression définitive d\'une archive',
    description: 'Supprime définitivement une archive de la base de données. Si l\'archive n\'était pas déjà supprimée logiquement, décrémente le nombre de places occupées dans le coffre.',
  })
  @ApiResponse({
    status: 200,
    description: 'Archive supprimée définitivement avec succès.',
    schema: {
      example: {
        success: true,
        message: 'Archive supprimée définitivement avec succès. Place libérée dans le coffre.',
        title: 'Suppression définitive',
        data: {
          id: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Archive non trouvée.',
    schema: {
      example: {
        success: false,
        message: 'Archive non trouvée.',
        title: 'Erreur',
      },
    },
  })
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.archiveService.hardDelete(id);
  }

  // 🗑️ Vider plusieurs coffres
  @Post('vider-coffres')
  @UseInterceptors(FileInterceptor('fichier'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Vider plusieurs coffres',
    description: 'Vide plusieurs coffres en transférant toutes leurs archives. Pour chaque archive, met à jour le statutArchive des courriers/transmissions/courriers départ à "transféré" et enregistre les informations de vidage (viderPar). Les archives sont vidées (tableaux JSON à vide) mais pas supprimées. Réinitialise le nombre de places à 0 pour chaque coffre.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['idCoffres', 'fichier'],
      properties: {
        idCoffres: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
          description: 'Liste des IDs de coffres à vider',
        },
        fichier: {
          type: 'string',
          format: 'binary',
          description: 'Fichier justificatif (obligatoire)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Coffres vidés avec succès.',
    schema: {
      example: {
        success: true,
        message: '3 coffre(s) vidé(s) avec succès. 45 archive(s) vidée(s). 120 courrier(s), 85 transmission(s), 60 courrier(s) départ transférés.',
        title: 'Vidage des coffres',
        data: {
          totalCoffres: 3,
          totalArchivesVidees: 45,
          totalCourriersTransferes: 120,
          totalTransmissionsTransferees: 85,
          totalCourriersDepartTransferes: 60,
          coffresVides: [
            {
              id: 1,
              nom: 'Coffre A1',
              salle: 'Salle A',
              archivesVidees: 15,
            },
            {
              id: 2,
              nom: 'Coffre A2',
              salle: 'Salle A',
              archivesVidees: 20,
            },
            {
              id: 3,
              nom: 'Coffre B1',
              salle: 'Salle B',
              archivesVidees: 10,
            },
          ],
          fichierJustificatif: 'archive/1707581124438-justificatif.pdf',
          viderPar: {
            id: 1,
            nomComplet: 'John Doe',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Le fichier justificatif est obligatoire.',
    schema: {
      example: {
        success: false,
        message: 'Le fichier justificatif est obligatoire.',
        title: 'Erreur',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Un ou plusieurs coffres sont introuvables.',
    schema: {
      example: {
        success: false,
        message: 'Un ou plusieurs coffres sont introuvables.',
        title: 'Erreur',
      },
    },
  })
  viderCoffres(@Body() viderCoffresDto: ViderCoffresDto, @UploadedFile() fichier: Express.Multer.File, @CurrentUser() user: any) {
    return this.archiveService.viderCoffres(viderCoffresDto, fichier, user.id);
  }

  // 📤 Retirer des éléments d'archives
  @Post('retirer-archives')
  @UseInterceptors(FileInterceptor('fichier'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Retirer des courriers, transmissions et courriers départ d\'archives',
    description: 'Retire des éléments spécifiques d\'archives dans un ou plusieurs coffres. Met à jour le statutArchive des courriers/transmissions/courriers départ à "transféré" et enregistre les informations de vidage (viderPar). Si une archive devient vide, décrémente le nombre de places du coffre et met à jour le nombre de places actuelles. Un fichier justificatif est obligatoire.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['items', 'fichier'],
      properties: {
        items: {
          type: 'string',
          example: JSON.stringify([
            {
              coffreId: 10,
              courrierIds: [1, 3, 5],
              transmissionIds: [2, 4],
              courrierDepartIds: [6, 8],
            },
            {
              coffreId: 20,
              courrierIds: [15, 18],
              transmissionIds: [],
              courrierDepartIds: [25, 30],
            },
          ]),
          description: 'JSON stringifié de la liste des coffres et éléments à retirer',
        },
        fichier: {
          type: 'string',
          format: 'binary',
          description: 'Fichier justificatif (obligatoire)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Éléments retirés avec succès.',
    schema: {
      example: {
        success: true,
        message: '2 coffre(s) traité(s) avec succès. 5 archive(s) modifiée(s), 2 archive(s) vidée(s). 8 courrier(s), 6 transmission(s), 4 courrier(s) départ retirés.',
        title: 'Retrait des archives',
        data: {
          totalCoffres: 2,
          totalArchivesModifiees: 5,
          totalArchivesVidees: 2,
          totalCourriersRetires: 8,
          totalTransmissionsRetirees: 6,
          totalCourriersDepartRetires: 4,
          coffresTraites: [
            {
              id: 10,
              nom: 'Coffre A1',
              salle: 'Salle A',
              archivesModifiees: 3,
              archivesVidees: 1,
            },
            {
              id: 20,
              nom: 'Coffre B2',
              salle: 'Salle B',
              archivesModifiees: 2,
              archivesVidees: 1,
            },
          ],
          fichierJustificatif: 'archive/1707581124438-justificatif.pdf',
          retirerPar: {
            id: 1,
            nomComplet: 'John Doe',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Le fichier justificatif est obligatoire.',
    schema: {
      example: {
        success: false,
        message: 'Le fichier justificatif est obligatoire.',
        title: 'Erreur',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé.',
    schema: {
      example: {
        success: false,
        message: 'Utilisateur non trouvé.',
        title: 'Erreur',
      },
    },
  })
  retirerArchives(@Body() retirerArchivesDto: RetirerArchivesDto, @UploadedFile() fichier: Express.Multer.File, @CurrentUser() user: any) {
    return this.archiveService.retirerArchives(retirerArchivesDto, fichier, user.id);
  }

  // 📋 Liste des éléments archivés puis transférés (vidés)
  @Get('transferes')
  @ApiOperation({
    summary: 'Liste des éléments archivés puis transférés',
    description: 'Récupère tous les courriers, transmissions et courriers départ qui ont été archivés puis transférés (vidés des coffres). Permet de tracer l\'historique complet des éléments transférés avec les informations de qui a vidé, quand, depuis quelle salle et quel coffre. Les résultats sont triés par date de création (plus récents d\'abord) et paginés.',
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Numéro de la page (défaut: 1)', 
    example: 1 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Nombre d\'éléments par page (défaut: 10)', 
    example: 10 
  })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    enum: ['courrier', 'transmission', 'courrier depart'], 
    description: 'Filtrer par type d\'élément', 
    example: 'courrier' 
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des éléments transférés récupérée avec succès.',
    schema: {
      example: {
        success: true,
        message: '150 élément(s) transféré(s) trouvé(s) (50 courrier(s), 60 transmission(s), 40 courrier(s) départ).',
        title: 'Liste des éléments transférés',
        data: {
          total: 150,
          totalCourriers: 50,
          totalTransmissions: 60,
          totalCourriersDepart: 40,
          page: 1,
          limit: 10,
          totalPages: 15,
          data: [
            {
              id: 1,
              type: 'courrier',
              numero: 'C-2024-001',
              objet: 'Demande de renseignements',
              document: '/uploads/courrier/document/file.pdf',
              dateCreation: '2024-01-15T10:30:00.000Z',
              isArchive: true,
              statutArchive: 'transféré',
              dateArchivage: '2024-03-20T14:00:00.000Z',
              viderPar: {
                id: 5,
                fullname: 'Jean Dupont',
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'jean.dupont@example.com',
                service: {
                  id: 10,
                  nom: 'Service Archivage',
                },
                date: '2024-03-20T14:00:00.000Z',
                salle: {
                  id: 2,
                  nom: 'Salle B',
                },
                coffre: {
                  id: 10,
                  nom: 'Coffre B2',
                },
                fichierJustificatif: 'archive/vidage-coffre-20241209-153045.pdf',
              },
            },
            {
              id: 2,
              type: 'transmission',
              numero: 'T-2024-015',
              objet: 'Transmission de documents',
              document: '/uploads/transmission/document/file2.pdf',
              dateCreation: '2024-01-14T09:20:00.000Z',
              isArchive: true,
              statutArchive: 'transféré',
              dateArchivage: '2024-03-19T11:00:00.000Z',
              viderPar: {
                id: 3,
                fullname: 'Marie Martin',
                nom: 'Martin',
                prenom: 'Marie',
                email: 'marie.martin@example.com',
                service: {
                  id: 8,
                  nom: 'Service Archives',
                },
                date: '2024-03-19T11:00:00.000Z',
                salle: {
                  id: 1,
                  nom: 'Salle A',
                },
                coffre: {
                  id: 5,
                  nom: 'Coffre A3',
                },
                fichierJustificatif: 'archive/vidage-coffre-20241208-102030.pdf',
              },
            },
            {
              id: 3,
              type: 'courrier depart',
              numero: 'CD-2024-008',
              objet: 'Réponse à demande',
              document: '/uploads/courrierdepart/document/file3.pdf',
              dateCreation: '2024-01-13T15:45:00.000Z',
              isArchive: true,
              statutArchive: 'transféré',
              dateArchivage: '2024-03-18T16:30:00.000Z',
              viderPar: {
                id: 5,
                fullname: 'Jean Dupont',
                nom: 'Dupont',
                prenom: 'Jean',
                email: 'jean.dupont@example.com',
                service: {
                  id: 10,
                  nom: 'Service Archivage',
                },
                date: '2024-03-18T16:30:00.000Z',
                salle: {
                  id: 2,
                  nom: 'Salle B',
                },
                coffre: {
                  id: 12,
                  nom: 'Coffre B5',
                },
                fichierJustificatif: 'archive/vidage-coffre-20241207-143515.pdf',
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non autorisé - Token JWT manquant ou invalide.',
  })
  findArchivesTransferes(@Query() query: ArchivesTransferesQueryDto) {
    return this.archiveService.findArchivesTransferes(query);
  }
}

