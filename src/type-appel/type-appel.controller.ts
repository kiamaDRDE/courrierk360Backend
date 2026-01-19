import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { TypeAppelService } from './type-appel.service';
import { CreateTypeAppelDto } from './dto/create-type-appel.dto';
import { UpdateTypeAppelDto } from './dto/update-type-appel.dto';
import { TypeAppelQueryDto } from './dto/type-appel-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseApi } from '../../common/responseApi.dto';

@ApiTags('TypeAppel')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('type-appel')
export class TypeAppelController {
  constructor(private readonly typeAppelService: TypeAppelService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Créer un ou plusieurs types d\'appel',
    description: 'Crée un nouveau type d\'appel ou plusieurs types d\'appel en une fois. Accepte soit un objet simple soit un tableau d\'objets.'
  })
  @ApiBody({
    type: CreateTypeAppelDto,
    description: 'Données pour créer un ou plusieurs types d\'appel',
    examples: {
      multiple: {
        summary: 'Création de plusieurs types d\'appel',
        value: [
          {
            libelle: 'Appel national',
            description: 'Appels effectués vers des numéros nationaux',
            categorie: 'Fixe'
          },
          {
            libelle: 'Appel international',
            description: 'Appels effectués vers des numéros internationaux',
            categorie: 'Mobile'
          }
        ]
      },
      single: {
        summary: 'Création d\'un seul type d\'appel',
        value: {
          libelle: 'Appel national',
          description: 'Appels effectués vers des numéros nationaux',
          categorie: 'Fixe'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Type(s) d\'appel créé(s) avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'number' },
        code: { type: 'string' },
        title: { type: 'string' },
        message: { type: 'string' },
        data: {
          oneOf: [
            {
              type: 'object',
              properties: {
                id: { type: 'number' },
                libelle: { type: 'string' },
                description: { type: 'string' },
                categorie: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            },
            {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  libelle: { type: 'string' },
                  description: { type: 'string' },
                  categorie: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          ]
        }
      },
      examples: {
        multiple: {
          summary: 'Création de plusieurs types',
          value: {
            success: true,
            statusCode: 201,
            code: 'TYPES_APPEL_CREATED',
            title: 'Succès',
            message: '2 type(s) d\'appel créé(s) avec succès',
            data: [
              {
                id: 1,
                libelle: 'Appel national',
                description: 'Appels effectués vers des numéros nationaux',
                categorie: 'Fixe',
                createdAt: '2025-12-31T14:30:00.000Z',
                updatedAt: '2025-12-31T14:30:00.000Z'
              },
              {
                id: 2,
                libelle: 'Appel international',
                description: 'Appels effectués vers des numéros internationaux',
                categorie: 'Mobile',
                createdAt: '2025-12-31T14:30:00.000Z',
                updatedAt: '2025-12-31T14:30:00.000Z'
              }
            ]
          }
        },
        single: {
          summary: 'Création d\'un seul type',
          value: {
            success: true,
            statusCode: 201,
            code: 'TYPE_APPEL_CREATED',
            title: 'Succès',
            message: 'Type d\'appel créé avec succès',
            data: {
              id: 1,
              libelle: 'Appel national',
              description: 'Appels effectués vers des numéros nationaux',
              categorie: 'Fixe',
              createdAt: '2025-12-31T14:30:00.000Z',
              updatedAt: '2025-12-31T14:30:00.000Z'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Des types d\'appel avec ces libellés existent déjà',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 409 },
        code: { type: 'string', example: 'TYPES_APPEL_CONFLICT' },
        title: { type: 'string', example: 'Conflit' },
        message: { type: 'string', example: 'Des types d\'appel avec les libellés suivants existent déjà' },
        data: { type: 'null', nullable: true }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Données de requête invalides',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        code: { type: 'string', example: 'VALIDATION_ERROR' },
        title: { type: 'string', example: 'Erreur de validation' },
        message: { type: 'string', example: 'Données de requête invalides' },
        data: { type: 'null', nullable: true }
      }
    }
  })
  async createTypeAppel(@Body() data: CreateTypeAppelDto | CreateTypeAppelDto[]) {
    return this.typeAppelService.createTypeAppel(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un type d\'appel' })
  @ApiBody({
    type: UpdateTypeAppelDto,
    description: 'Données pour modifier un type d\'appel',
    examples: {
      update: {
        summary: 'Modification d\'un type d\'appel',
        value: {
          libelle: 'Appel national modifié',
          description: 'Description mise à jour pour les appels nationaux',
          categorie: 'Mobile'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Type d\'appel modifié avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'number' },
        code: { type: 'string' },
        title: { type: 'string' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            libelle: { type: 'string' },
            description: { type: 'string' },
            categorie: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      example: {
        success: true,
        statusCode: 200,
        code: 'TYPE_APPEL_UPDATED',
        title: 'Succès',
        message: 'Type d\'appel modifié avec succès',
        data: {
          id: 1,
          libelle: 'Appel national modifié',
          description: 'Description mise à jour pour les appels nationaux',
          categorie: 'Mobile',
          createdAt: '2025-12-31T14:30:00.000Z',
          updatedAt: '2026-01-05T10:15:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Type d\'appel introuvable',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        code: { type: 'string', example: 'TYPE_APPEL_NOT_FOUND' },
        title: { type: 'string', example: 'Erreur' },
        message: { type: 'string', example: 'Type d\'appel introuvable' },
        data: { type: 'null', nullable: true }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètre ID invalide',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        code: { type: 'string', example: 'INVALID_PARAMETER' },
        title: { type: 'string', example: 'Erreur de paramètre' },
        message: { type: 'string', example: 'Paramètre invalide' },
        data: { type: 'null', nullable: true }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Un type d\'appel avec ce libellé existe déjà',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 409 },
        code: { type: 'string', example: 'TYPE_APPEL_CONFLICT' },
        title: { type: 'string', example: 'Conflit' },
        message: { type: 'string', example: 'Conflit détecté' },
        data: { type: 'null', nullable: true }
      }
    }
  })
  async updateTypeAppel(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTypeAppelDto: UpdateTypeAppelDto,
  ) {
    return this.typeAppelService.updateTypeAppel(id, updateTypeAppelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un type d\'appel' })
  @ApiResponse({
    status: 200,
    description: 'Type d\'appel supprimé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'TYPE_APPEL_DELETED' },
        title: { type: 'string', example: 'Succès' },
        message: { type: 'string', example: 'Type d\'appel supprimé avec succès' },
        data: { type: 'null', nullable: true }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Type d\'appel introuvable',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        code: { type: 'string', example: 'TYPE_APPEL_NOT_FOUND' },
        title: { type: 'string', example: 'Erreur' },
        message: { type: 'string', example: 'Type d\'appel introuvable' },
        data: { type: 'null', nullable: true }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètre ID invalide',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        code: { type: 'string', example: 'INVALID_PARAMETER' },
        title: { type: 'string', example: 'Erreur de paramètre' },
        message: { type: 'string', example: 'Paramètre invalide' },
        data: { type: 'null', nullable: true }
      }
    }
  })
  async deleteTypeAppel(@Param('id', ParseIntPipe) id: number) {
    return this.typeAppelService.deleteTypeAppel(id);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lister les types d\'appel avec filtres et pagination',
    description: 'Récupère la liste des types d\'appel avec possibilité de filtrage et pagination. Utilisez limit=0 pour récupérer tous les résultats.'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des types d\'appel récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'number' },
        code: { type: 'string' },
        title: { type: 'string' },
        message: { type: 'string' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              libelle: { type: 'string' },
              description: { type: 'string' },
              categorie: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' }
          }
        }
      },
      examples: {
        withPagination: {
          summary: 'Liste avec pagination',
          value: {
            success: true,
            statusCode: 200,
            code: 'TYPES_APPEL_RETRIEVED',
            title: 'Succès',
            message: 'Liste des types d\'appel récupérée avec succès',
            data: [
              {
                id: 1,
                libelle: 'Appel national',
                description: 'Appels effectués vers des numéros nationaux',
                categorie: 'Fixe',
                createdAt: '2025-12-31T14:30:00.000Z',
                updatedAt: '2025-12-31T14:30:00.000Z'
              },
              {
                id: 2,
                libelle: 'Appel international',
                description: 'Appels effectués vers des numéros internationaux',
                categorie: 'Mobile',
                createdAt: '2025-12-31T15:00:00.000Z',
                updatedAt: '2025-12-31T15:00:00.000Z'
              }
            ],
            pagination: {
              total: 15,
              page: 1,
              limit: 10,
              totalPages: 2
            }
          }
        },
        emptyResult: {
          summary: 'Aucun résultat trouvé',
          value: {
            success: true,
            statusCode: 200,
            code: 'TYPES_APPEL_RETRIEVED',
            title: 'Succès',
            message: 'Liste des types d\'appel récupérée avec succès',
            data: [],
            pagination: {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 0
            }
          }
        }
      }
    }
  })
  async listTypesAppel(@Query() query: TypeAppelQueryDto) {
    return this.typeAppelService.listTypesAppel(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les informations d\'un type d\'appel spécifique' })
  @ApiResponse({
    status: 200,
    description: 'Type d\'appel récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        statusCode: { type: 'number' },
        code: { type: 'string' },
        title: { type: 'string' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            libelle: { type: 'string' },
            description: { type: 'string' },
            categorie: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      example: {
        success: true,
        statusCode: 200,
        code: 'TYPE_APPEL_RETRIEVED',
        title: 'Succès',
        message: 'Type d\'appel récupéré avec succès',
        data: {
          id: 1,
          libelle: 'Appel national',
          description: 'Appels effectués vers des numéros nationaux',
          categorie: 'Fixe',
          createdAt: '2025-12-31T14:30:00.000Z',
          updatedAt: '2025-12-31T14:30:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Type d\'appel introuvable',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        code: { type: 'string', example: 'TYPE_APPEL_NOT_FOUND' },
        title: { type: 'string', example: 'Erreur' },
        message: { type: 'string', example: 'Type d\'appel introuvable' },
        data: { type: 'null', nullable: true }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètre ID invalide',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        code: { type: 'string', example: 'INVALID_PARAMETER' },
        title: { type: 'string', example: 'Erreur de paramètre' },
        message: { type: 'string', example: 'Paramètre invalide' },
        data: { type: 'null', nullable: true }
      }
    }
  })
  async getTypeAppelById(@Param('id', ParseIntPipe) id: number) {
    return this.typeAppelService.getTypeAppelById(id);
  }
}
