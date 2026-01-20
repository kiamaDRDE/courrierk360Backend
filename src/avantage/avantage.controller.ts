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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AvantageService } from './avantage.service';
import { CreateAvantageDto } from './dto/create-avantage.dto';
import { UpdateAvantageDto } from './dto/update-avantage.dto';
import { QueryAvantageDto } from './dto/query-avantage.dto';
import { UpdateMultipleAvantageDto } from './dto/update-multiple-avantage.dto';
import { ResponseApi } from '../../common/responseApi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Avantages')
@Controller('avantages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
@ApiResponse({
  status: 401,
  description: 'Error 401: Unauthorized.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 401,
        code: 'failure',
        title: 'UnauthorizedException',
        message: 'Token invalide ou expiré.',
        data: [],
      },
    },
  },
})
export class AvantageController {
  constructor(private readonly avantageService: AvantageService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer plusieurs avantages',
    description: 'Crée plusieurs avantages avec un nom, une valeur et un indicateur gratuit. Les noms doivent être uniques. Optionnellement associer à une offre.',
  })
  @ApiResponse({
    status: 201,
    description: 'Avantages créés avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'AVANTAGES_CREATED',
          title: 'Avantages créés avec succès',
          message: 'Les nouveaux avantages ont été créés et sont prêts à être associés aux offres',
          data: [
            {
              id: 15,
              nom: 'Internet 5G Illimité',
              valeur: 0,
              isGratuit: true,
              description: 'Accès illimité à Internet en 5G avec débit prioritaire',
              typeAvantage: 'data',
              uniteMesure: 'illimite',
              plafondUtilisation: null,
              conditionsActivation: 'automatique',
              dureeValidite: 'mensuelle',
              createdAt: '2025-01-05T19:30:00.000Z',
              updatedAt: '2025-01-05T19:30:00.000Z',
              statut: 'actif',
              popularite: {
                demande: 'elevee',
                satisfaction: 4.8,
                utilisationMoyenne: '89%'
              },
              offres: [
                {
                  id: 8,
                  nom: 'Forfait Premium 5G',
                  prix: 25000,
                  typeOffre: 'mobile'
                },
                {
                  id: 12,
                  nom: 'Entreprise Pro Max',
                  prix: 85000,
                  typeOffre: 'entreprise'
                }
              ]
            },
            {
              id: 16,
              nom: 'Roaming International Gratuit',
              valeur: 30,
              isGratuit: false,
              description: 'Communication gratuite dans 30 pays d\'Afrique et d\'Europe',
              typeAvantage: 'roaming',
              uniteMesure: 'pays',
              plafondUtilisation: '30 jours/mois',
              conditionsActivation: 'sur_demande',
              dureeValidite: 'mensuelle',
              createdAt: '2025-01-05T19:30:00.000Z',
              updatedAt: '2025-01-05T19:30:00.000Z',
              statut: 'actif',
              popularite: {
                demande: 'moderee',
                satisfaction: 4.5,
                utilisationMoyenne: '45%'
              },
              offres: [
                {
                  id: 12,
                  nom: 'Entreprise Pro Max',
                  prix: 85000,
                  typeOffre: 'entreprise'
                }
              ]
            }
          ]
        }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Des avantages avec ces noms existent déjà',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Des avantages avec les noms suivants existent déjà : SMS illimités, Appels illimités' },
        error: { type: 'string', example: 'Conflict' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Données de requête invalides',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'array',
          items: { type: 'string' },
          example: ['avantages should not be empty', 'avantages.0.valeur must be a positive number']
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  @ApiBody({
    description: 'Données pour créer de nouveaux avantages',
    schema: {
      type: 'object',
      properties: {
        avantages: {
          type: 'array',
          description: 'Liste des avantages à créer',
          items: {
            type: 'object',
            properties: {
              nom: {
                type: 'string',
                description: 'Nom unique de l\'avantage',
                example: 'SMS Illimités'
              },
              valeur: {
                type: 'number',
                description: 'Valeur numérique de l\'avantage',
                example: 0
              },
              isGratuit: {
                type: 'boolean',
                description: 'Indique si l\'avantage est gratuit ou payant',
                example: true,
                default: false
              }
            },
            required: ['nom', 'valeur']
          },
          example: [
            {
              nom: 'SMS Illimités',
              valeur: 0,
              isGratuit: true
            },
            {
              nom: 'Appels On-Net 30min',
              valeur: 30,
              isGratuit: false
            }
          ]
        },
        offreId: {
          type: 'number',
          description: 'ID optionnel de l\'offre à associer aux avantages',
          example: 1
        }
      },
      required: ['avantages']
    }
  })
  async create(@Body() createAvantageDto: CreateAvantageDto) {
    const avantage = await this.avantageService.create(createAvantageDto);
    return new ResponseApi(
      true,
      201,
      'AVANTAGE_CREATED',
      'Avantage créé avec succès',
      'Le nouvel avantage a été créé avec succès',
      avantage
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Obtenir la liste des avantages',
    description: 'Récupère la liste paginée des avantages avec filtrage optionnel par nom, valeur, statut gratuit et offre associée.',
  })
  @ApiQuery({
    name: 'nom',
    required: false,
    type: String,
    description: 'Filtrer par nom d\'avantage (recherche partielle)',
    example: 'SMS',
  })
  @ApiQuery({
    name: 'valeurMin',
    required: false,
    type: Number,
    description: 'Valeur minimale pour filtrer les avantages',
    example: 0,
  })
  @ApiQuery({
    name: 'valeurMax',
    required: false,
    type: Number,
    description: 'Valeur maximale pour filtrer les avantages',
    example: 100,
  })
  @ApiQuery({
    name: 'isGratuit',
    required: false,
    type: Boolean,
    description: 'Filtrer par statut gratuit (true pour gratuit, false pour payant)',
    example: true,
  })
  @ApiQuery({
    name: 'offreId',
    required: false,
    type: Number,
    description: 'ID de l\'offre pour filtrer les avantages associés à cette offre',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page pour la pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre d\'éléments par page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des avantages récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Liste des avantages' },
        message: { type: 'string', example: '10 avantage(s) sur 25 récupéré(s) avec succès.' },
        data: {
          type: 'object',
          properties: {
            avantages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  nom: { type: 'string', example: 'SMS illimités' },
                  valeur: { type: 'number', example: 0 },
                  isGratuit: { type: 'boolean', example: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  offres: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', example: 1 },
                        nom: { type: 'string', example: 'Forfait Premium' },
                      },
                    },
                  },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 25 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 3 },
                hasNextPage: { type: 'boolean', example: true },
                hasPreviousPage: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Paramètres de requête invalides',
    schema: {
      type: 'object',
      properties: {
        message: { 
          type: 'array',
          items: { type: 'string' },
          example: ['page must be a positive integer', 'limit must be between 1 and 100']
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  async findAll(@Query() query: QueryAvantageDto) {
    const avantages = await this.avantageService.findAll(query);
    return new ResponseApi(
      true,
      200,
      'AVANTAGES_RETRIEVED',
      'Liste des avantages récupérée avec succès',
      'La liste des avantages a été récupérée avec succès',
      avantages
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir un avantage par ID',
    description: 'Récupère les détails d\'un avantage spécifique avec la liste des offres associées.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID unique de l\'avantage',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Avantage récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Avantage récupéré' },
        message: { type: 'string', example: 'Avantage "SMS illimités" récupéré avec succès.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nom: { type: 'string', example: 'SMS illimités' },
            valeur: { type: 'number', example: 0 },
            isGratuit: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            offres: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  nom: { type: 'string', example: 'Forfait Premium' },
                  operateur: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', example: 1 },
                      nom: { type: 'string', example: 'Orange' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Avantage non trouvé',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Avantage avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const avantage = await this.avantageService.findOne(id);
    return new ResponseApi(
      true,
      200,
      'AVANTAGE_RETRIEVED',
      'Avantage récupéré avec succès',
      'L\'avantage a été récupéré avec succès',
      avantage
    );
  }

  @Patch()
  @ApiOperation({
    summary: 'Mettre à jour plusieurs avantages',
    description: 'Met à jour plusieurs avantages en une seule opération. Chaque avantage doit avoir un ID valide.',
  })
  @ApiBody({
    type: UpdateMultipleAvantageDto,
    description: 'Données pour mettre à jour plusieurs avantages',
    examples: {
      multiple: {
        summary: 'Mise à jour de plusieurs avantages',
        value: {
          avantages: [
            {
              id: 1,
              nom: 'SMS illimités Premium',
              valeur: 0,
              offreId: 2
            },
            {
              id: 2,
              nom: 'Appels illimités Modifiés',
              valeur: 15.50
              // offreId non renseigné = supprime l'association avec les offres
            },
            {
              id: 3,
              valeur: 25.00
              // nom non renseigné = pas de modification du nom
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Avantages mis à jour avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'AVANTAGES_UPDATED',
          title: 'Avantages modifiés avec succès',
          message: 'Les avantages ont été modifiés avec succès',
          data: [
            {
              id: 1,
              nom: 'SMS illimités Premium',
              valeur: 0,
              createdAt: '2025-12-31T14:30:00.000Z',
              updatedAt: '2026-01-05T16:45:00.000Z',
              offres: [
                {
                  id: 2,
                  nom: 'Forfait Standard'
                }
              ]
            },
            {
              id: 2,
              nom: 'Appels illimités Modifiés',
              valeur: 15.50,
              createdAt: '2025-12-31T14:30:00.000Z',
              updatedAt: '2026-01-05T16:45:00.000Z',
              offres: []
            }
          ]
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Un ou plusieurs avantages introuvables',
  })
  @ApiConflictResponse({
    description: 'Conflit de noms avec des avantages existants ou offres introuvables',
  })
  @ApiBadRequestResponse({
    description: 'Données de requête invalides',
  })
  async updateMultiple(@Body() updateData: UpdateMultipleAvantageDto) {
    const result = await this.avantageService.updateMultiple(updateData);
    return new ResponseApi(
      true,
      200,
      'AVANTAGES_UPDATED',
      'Avantages modifiés avec succès',
      'Les avantages ont été modifiés avec succès',
      result
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un avantage',
    description: 'Supprime un avantage et toutes ses liaisons avec les offres et options. Les liaisons sont automatiquement supprimées avant la suppression de l\'avantage.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID unique de l\'avantage à supprimer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Avantage supprimé avec succès',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'AVANTAGE_DELETED',
          title: 'Avantage supprimé',
          message: 'Avantage "SMS illimités" supprimé avec succès. Les liaisons suivantes ont été supprimées automatiquement: 2 offre(s): Forfait Basic, Forfait Premium, 1 option(s): Option SMS.',
          data: {
            id: 1,
            liaisonsSupprimeesCount: 3,
            offresLiees: [
              { id: 1, nom: 'Forfait Basic' },
              { id: 2, nom: 'Forfait Premium' }
            ],
            optionsLiees: [
              { id: 5, nom: 'Option SMS' }
            ]
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Avantage non trouvé',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Avantage avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.avantageService.remove(id);
    return new ResponseApi(
      true,
      200,
      'AVANTAGE_DELETED',
      'Avantage supprimé avec succès',
      'L\'avantage a été supprimé avec succès',
      result
    );
  }
}
