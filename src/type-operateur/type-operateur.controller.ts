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
import { TypeOperateurService } from './type-operateur.service';
import { CreateTypeOperateurDto } from './dto/create-type-operateur.dto';
import { UpdateTypeOperateurDto } from './dto/update-type-operateur.dto';
import { QueryTypeOperateurDto } from './dto/query-type-operateur.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Types d\'opérateur')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('types-operateur')
export class TypeOperateurController {
  constructor(private readonly typeOperateurService: TypeOperateurService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un ou plusieurs types d\'opérateur',
    description: 'Crée un nouveau type d\'opérateur ou plusieurs types d\'opérateur en une fois. Accepte soit un objet simple soit un tableau d\'objets. Tous les noms doivent être uniques.',
  })
  @ApiBody({
    type: CreateTypeOperateurDto,
    description: 'Données pour créer un ou plusieurs types d\'opérateur',
    examples: {
      multiple: {
        summary: 'Création de plusieurs types d\'opérateur',
        value: [
          {
            nom: 'Orange',
            description: 'Opérateur mobile Orange'
          },
          {
            nom: 'MTN',
            description: 'Opérateur mobile MTN'
          },
          {
            nom: 'Moov',
            description: 'Opérateur mobile Moov'
          }
        ]
      },
      single: {
        summary: 'Création d\'un seul type d\'opérateur',
        value: {
          nom: 'Orange',
          description: 'Opérateur mobile Orange'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Type(s) d\'opérateur créé(s) avec succès',
    examples: {
      multiple: {
        summary: 'Réponse pour plusieurs types d\'opérateur créés',
        value: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Types d\'opérateur créés',
          message: '3 types d\'opérateur créés avec succès.',
          data: [
            {
              id: 1,
              nom: 'Orange',
              description: 'Opérateur mobile Orange',
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z'
            },
            {
              id: 2,
              nom: 'MTN',
              description: 'Opérateur mobile MTN',
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z'
            },
            {
              id: 3,
              nom: 'Moov',
              description: 'Opérateur mobile Moov',
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z'
            }
          ]
        }
      },
      single: {
        summary: 'Réponse pour un seul type d\'opérateur créé',
        value: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Type d\'opérateur créé',
          message: 'Type d\'opérateur "Orange" créé avec succès.',
          data: {
            id: 1,
            nom: 'Orange',
            description: 'Opérateur mobile Orange',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z'
          }
        }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Un type d\'opérateur avec ce nom existe déjà',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Un type d\'opérateur avec le nom "Opérateur Mobile" existe déjà' },
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
          example: ['nom should not be empty', 'nom must be a string']
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  create(@Body() data: CreateTypeOperateurDto | CreateTypeOperateurDto[]) {
    return this.typeOperateurService.create(data);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtenir la liste des types d\'opérateur',
    description: 'Récupère la liste paginée des types d\'opérateur avec filtrage optionnel par nom et description.',
  })
  @ApiQuery({
    name: 'nom',
    required: false,
    type: String,
    description: 'Filtrer par nom de type d\'opérateur (recherche partielle)',
    example: 'Mobile',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    type: String,
    description: 'Filtrer par description (recherche partielle)',
    example: 'téléphonie',
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
    description: 'Liste des types d\'opérateur récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Liste des types d\'opérateur' },
        message: { type: 'string', example: '5 type(s) d\'opérateur sur 12 récupéré(s) avec succès.' },
        data: {
          type: 'object',
          properties: {
            typesOperateur: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  nom: { type: 'string', example: 'Opérateur Mobile' },
                  description: { type: 'string', example: 'Opérateur spécialisé dans les services mobiles' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 12 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 2 },
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
  findAll(@Query() query: QueryTypeOperateurDto) {
    return this.typeOperateurService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir un type d\'opérateur par ID',
    description: 'Récupère les détails d\'un type d\'opérateur spécifique.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID unique du type d\'opérateur',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Type d\'opérateur récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Type d\'opérateur récupéré' },
        message: { type: 'string', example: 'Type d\'opérateur "Opérateur Mobile" récupéré avec succès.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nom: { type: 'string', example: 'Opérateur Mobile' },
            description: { type: 'string', example: 'Opérateur spécialisé dans les services mobiles' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Type d\'opérateur non trouvé',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Type d\'opérateur avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.typeOperateurService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un type d\'opérateur',
    description: 'Met à jour partiellement un type d\'opérateur existant. Le nom doit rester unique s\'il est modifié.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID unique du type d\'opérateur à mettre à jour',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Type d\'opérateur mis à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Type d\'opérateur mis à jour' },
        message: { type: 'string', example: 'Type d\'opérateur "Opérateur Mobile Premium" mis à jour avec succès.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nom: { type: 'string', example: 'Opérateur Mobile Premium' },
            description: { type: 'string', example: 'Opérateur premium spécialisé dans les services mobiles' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Type d\'opérateur non trouvé',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Type d\'opérateur avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Un type d\'opérateur avec ce nom existe déjà',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Un type d\'opérateur avec le nom "Opérateur Mobile Premium" existe déjà' },
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
          example: ['nom must be a string']
        },
        error: { type: 'string', example: 'Bad Request' },
        statusCode: { type: 'number', example: 400 },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTypeOperateurDto: UpdateTypeOperateurDto,
  ) {
    return this.typeOperateurService.update(id, updateTypeOperateurDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un type d\'opérateur',
    description: 'Supprime un type d\'opérateur.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID unique du type d\'opérateur à supprimer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Type d\'opérateur supprimé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'Type d\'opérateur supprimé' },
        message: { type: 'string', example: 'Type d\'opérateur "Opérateur Mobile" supprimé avec succès.' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Type d\'opérateur non trouvé',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Type d\'opérateur avec l\'ID 1 introuvable' },
        error: { type: 'string', example: 'Not Found' },
        statusCode: { type: 'number', example: 404 },
      },
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.typeOperateurService.remove(id);
  }
}
