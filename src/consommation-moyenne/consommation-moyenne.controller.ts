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
import { ConsommationMoyenneService } from './consommation-moyenne.service';
import { CreateConsommationMoyenneDto } from './dto/create-consommation-moyenne.dto';
import { UpdateConsommationMoyenneDto } from './dto/update-consommation-moyenne.dto';
import { QueryConsommationMoyenneDto } from './dto/query-consommation-moyenne.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Consommations moyennes')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('consommations-moyennes')
export class ConsommationMoyenneController {
  constructor(private readonly consommationMoyenneService: ConsommationMoyenneService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Créer plusieurs consommations moyennes pour une offre',
    description: 'Crée plusieurs consommations moyennes pour une seule offre ou sans offre spécifique.',
  })
  @ApiBody({
    type: CreateConsommationMoyenneDto,
    description: 'Données pour créer plusieurs consommations moyennes',
    examples: {
      withOffre: {
        summary: 'Création de plusieurs consommations moyennes pour une offre',
        value: {
          offreId: 1,
          consommationsMoyennes: [
            {
              nom: 'Consommation Mobile Standard'
            },
            {
              nom: 'Consommation Mobile Premium'
            },
            {
              nom: 'Consommation Internet'
            }
          ]
        }
      },
      withoutOffre: {
        summary: 'Création de plusieurs consommations moyennes sans offre',
        value: {
          consommationsMoyennes: [
            {
              nom: 'Consommation Fixe Basic'
            },
            {
              nom: 'Consommation Fixe Premium'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Consommations moyennes créées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Consommations créées' },
        message: { type: 'string', example: '3 consommation(s) moyenne(s) créée(s) avec succès.' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              nom: { type: 'string', example: 'Consommation Mobile Standard' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              offres: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    nom: { type: 'string', example: 'Offre Premium' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Une ou plusieurs consommations avec ces noms existent déjà',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Des consommations moyennes avec les noms suivants existent déjà : Consommation Mobile Standard, Consommation Internet' },
        error: { type: 'string', example: 'Conflict' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'L\'offre spécifiée n\'existe pas ou données invalides',
    schema: {
      type: 'object',
      properties: {
        message: { 
          oneOf: [
            { type: 'string', example: 'L\'offre avec l\'ID 99 n\'existe pas' },
            { 
              type: 'array', 
              items: { type: 'string' },
              example: ['Le nom est obligatoire', 'Le nom ne doit pas dépasser 255 caractères']
            }
          ]
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  create(@Body() data: CreateConsommationMoyenneDto) {
    return this.consommationMoyenneService.create(data);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lister les consommations moyennes avec filtres et pagination',
    description: 'Récupère toutes les consommations moyennes avec possibilité de filtrage par nom, valeur et pagination. Retourne également les offres associées à chaque consommation moyenne.'
  })
  @ApiQuery({
    name: 'nom',
    description: 'Filtre par nom de consommation moyenne (recherche partielle)',
    required: false,
    type: 'string',
    example: 'Mobile'
  })
  @ApiQuery({
    name: 'page',
    description: 'Numéro de page (pagination)',
    required: false,
    type: 'number',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Nombre d\'éléments par page',
    required: false,
    type: 'number',
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des consommations moyennes récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Consommations moyennes récupérées' },
        message: { type: 'string', example: 'Liste des consommations moyennes récupérée avec succès.' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              nom: { type: 'string', example: 'Consommation Mobile Standard' },
              createdAt: { type: 'string', format: 'date-time', example: '2025-12-31T14:30:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2025-12-31T14:30:00.000Z' },
              offres: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    nom: { type: 'string', example: 'Offre Premium' }
                  }
                }
              }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 25 },
            totalPages: { type: 'number', example: 3 }
          }
        }
      }
    }
  })
  findAll(@Query() query: QueryConsommationMoyenneDto) {
    return this.consommationMoyenneService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer une consommation moyenne par son ID',
    description: 'Récupère une consommation moyenne spécifique par son identifiant unique, incluant toutes les offres associées.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la consommation moyenne à récupérer',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Consommation moyenne récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Consommation récupérée' },
        message: { type: 'string', example: 'Consommation moyenne "Consommation Mobile Standard" récupérée avec succès.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nom: { type: 'string', example: 'Consommation Mobile Standard' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-12-31T14:30:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-12-31T14:30:00.000Z' },
            offres: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  nom: { type: 'string', example: 'Offre Premium' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Consommation moyenne introuvable',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Consommation moyenne avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consommationMoyenneService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Modifier une consommation moyenne',
    description: 'Met à jour les informations d\'une consommation moyenne existante. Permet de modifier le nom, la valeur et l\'association avec une offre.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la consommation moyenne à modifier',
    type: 'number',
    example: 1,
  })
  @ApiBody({
    type: UpdateConsommationMoyenneDto,
    description: 'Nouvelles données de la consommation moyenne (tous les champs sont optionnels)',
    examples: {
      updateAll: {
        summary: 'Modification complète',
        value: {
          nom: 'Consommation Mobile Premium+',
          offreId: 2
        }
      },
      updatePartial: {
        summary: 'Modification partielle (nom seulement)',
        value: {
          nom: 'Consommation Mobile Standard+'
        }
      },
      removeOffre: {
        summary: 'Retirer l\'association avec une offre',
        value: {
          offreId: null
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Consommation moyenne modifiée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Consommation modifiée' },
        message: { type: 'string', example: 'Consommation moyenne "Consommation Mobile Premium+" modifiée avec succès.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nom: { type: 'string', example: 'Consommation Mobile Premium+' },
            createdAt: { type: 'string', format: 'date-time', example: '2025-12-31T14:30:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2025-12-31T14:35:00.000Z' },
            offres: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 2 },
                  nom: { type: 'string', example: 'Offre Ultra' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Consommation moyenne introuvable',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Consommation moyenne avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Une consommation avec ce nom existe déjà',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Une consommation moyenne avec le nom "Consommation Mobile Premium+" existe déjà' },
        error: { type: 'string', example: 'Conflict' },
        statusCode: { type: 'number', example: 409 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'L\'offre spécifiée n\'existe pas ou données invalides',
    schema: {
      type: 'object',
      properties: {
        message: { 
          oneOf: [
            { type: 'string', example: 'L\'offre avec l\'ID 99 n\'existe pas' },
            { 
              type: 'array', 
              items: { type: 'string' },
              example: ['Le nom ne doit pas dépasser 255 caractères']
            }
          ]
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConsommationMoyenneDto: UpdateConsommationMoyenneDto,
  ) {
    return this.consommationMoyenneService.update(id, updateConsommationMoyenneDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Supprimer une consommation moyenne',
    description: 'Supprime définitivement une consommation moyenne et toutes ses associations avec les offres. Cette action est irréversible.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID unique de la consommation moyenne à supprimer',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Consommation moyenne supprimée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Consommation supprimée' },
        message: { type: 'string', example: 'Consommation moyenne "Consommation Mobile Standard" supprimée avec succès.' },
        data: { type: 'null', example: null }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Consommation moyenne introuvable',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Consommation moyenne avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.consommationMoyenneService.remove(id);
  }
}
