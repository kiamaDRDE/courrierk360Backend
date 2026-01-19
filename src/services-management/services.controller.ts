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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Services')
@Controller('services')
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
export class ServicesController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un ou plusieurs services',
    description: 'Crée un nouveau service ou plusieurs services en une fois. Accepte soit un objet simple soit un tableau d\'objets. Tous les noms doivent être uniques.',
  })
  @ApiBody({
    type: CreateServiceDto,
    description: 'Données pour créer un ou plusieurs services',
    examples: {
      multiple: {
        summary: 'Création de plusieurs services',
        value: [
          {
            nom: 'Mobile',
            description: 'Service de télécommunication mobile'
          },
          {
            nom: 'Fixe',
            description: 'Service de télécommunication fixe'
          },
          {
            nom: 'Internet',
            description: 'Service Internet haut débit'
          }
        ]
      },
      single: {
        summary: 'Création d\'un seul service',
        value: {
          nom: 'Mobile',
          description: 'Service de télécommunication mobile'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Service(s) créé(s) avec succès.',
    content: {
      'application/json': {
        examples: {
          multiple: {
            summary: 'Réponse pour plusieurs services créés',
            value: {
              success: true,
              statusCode: 201,
              code: 'success',
              title: 'Services créés',
              message: '3 service(s) créé(s) avec succès.',
              data: [
                {
                  id: 1,
                  nom: 'Mobile',
                  description: 'Service de télécommunication mobile',
                  createdAt: '2025-12-31T10:00:00.000Z',
                  updatedAt: '2025-12-31T10:00:00.000Z',
                },
                {
                  id: 2,
                  nom: 'Fixe',
                  description: 'Service de télécommunication fixe',
                  createdAt: '2025-12-31T10:00:00.000Z',
                  updatedAt: '2025-12-31T10:00:00.000Z',
                },
                {
                  id: 3,
                  nom: 'Internet',
                  description: 'Service Internet haut débit',
                  createdAt: '2025-12-31T10:00:00.000Z',
                  updatedAt: '2025-12-31T10:00:00.000Z',
                }
              ],
            }
          },
          single: {
            summary: 'Réponse pour un seul service créé',
            value: {
              success: true,
              statusCode: 201,
              code: 'success',
              title: 'Service créé',
              message: 'Le service "Mobile" a été créé avec succès.',
              data: {
                id: 1,
                nom: 'Mobile',
                description: 'Service de télécommunication mobile',
                createdAt: '2025-12-31T10:00:00.000Z',
                updatedAt: '2025-12-31T10:00:00.000Z',
              },
            }
          }
        }
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Un ou plusieurs services avec ces noms existent déjà.',
  })
  create(@Body() data: CreateServiceDto | CreateServiceDto[]) {
    return this.serviceService.create(data);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lister les services',
    description: 'Récupère la liste des services avec pagination et filtres.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Numéro de la page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Nombre d\'éléments par page (0 = tous)' })
  @ApiQuery({ name: 'nom', required: false, type: String, example: 'Mobile', description: 'Filtrer par nom (recherche partielle)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des services récupérée avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Liste des services',
          message: '3 service(s) récupéré(s) sur 3 au total.',
          data: {
            services: [
              {
                id: 1,
                nom: 'Mobile',
                description: 'Service de télécommunication mobile',
                createdAt: '2025-12-31T10:00:00.000Z',
                updatedAt: '2025-12-31T10:00:00.000Z',
              },
              {
                id: 2,
                nom: 'Fixe',
                description: 'Service de téléphonie fixe',
                createdAt: '2025-12-31T09:00:00.000Z',
                updatedAt: '2025-12-31T09:00:00.000Z',
              },
              {
                id: 3,
                nom: 'Internet',
                description: 'Service d\'accès Internet',
                createdAt: '2025-12-31T08:00:00.000Z',
                updatedAt: '2025-12-31T08:00:00.000Z',
              },
            ],
            pagination: {
              total: 3,
              page: 1,
              limit: 10,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        },
      },
    },
  })
  findAll(@Query() query: QueryServiceDto) {
    return this.serviceService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Détails d\'un service',
    description: 'Récupère toutes les informations d\'un service spécifique par son ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du service',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Détails du service récupérés avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Détails du service',
          message: 'Informations du service "Mobile" récupérées avec succès.',
          data: {
            id: 1,
            nom: 'Mobile',
            description: 'Service de télécommunication mobile',
            createdAt: '2025-12-31T10:00:00.000Z',
            updatedAt: '2025-12-31T10:00:00.000Z',
            operateurs: [
              {
                id: 1,
                operateur: {
                  id: 1,
                  nom: 'MTN Cameroon',
                  code: 'MTN',
                  type: 'Mobile',
                },
              },
              {
                id: 2,
                operateur: {
                  id: 2,
                  nom: 'Orange Cameroun',
                  code: 'ORANGE',
                  type: 'Mobile',
                },
              },
            ],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Service introuvable.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour un service',
    description: 'Met à jour les informations d\'un service. Tous les champs sont optionnels.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du service à mettre à jour',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Service mis à jour avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Service mis à jour',
          message: 'Le service "Mobile Pro" a été mis à jour avec succès.',
          data: {
            id: 1,
            nom: 'Mobile Pro',
            description: 'Service de télécommunication mobile professionnel',
            createdAt: '2025-12-31T10:00:00.000Z',
            updatedAt: '2025-12-31T11:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Service introuvable.',
  })
  @ApiResponse({
    status: 409,
    description: 'Un service avec ce nom existe déjà.',
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateServiceDto: UpdateServiceDto) {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un service',
    description: 'Supprime un service par son ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du service à supprimer',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Service supprimé avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Service supprimé',
          message: 'Le service "Mobile" a été supprimé avec succès.',
          data: {
            id: 1,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Service introuvable.',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.remove(id);
  }
}
