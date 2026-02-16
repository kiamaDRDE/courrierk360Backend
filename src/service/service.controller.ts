// src/service/service.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Service')
@Controller('service')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // 🔧 REMIS POUR TEST
@ApiResponse({
  status: 400,
  description: 'Error 400: Bad Request.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 400,
        code: 'failure',
        title: 'BadRequestException',
        message: 'Un service avec ce nom existe déjà.',
        data: [],
      },
    },
  },
})
@ApiResponse({
  status: 404,
  description: 'Error 404: Not Found.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 404,
        code: 'failure',
        title: 'NotFoundException',
        message: 'Service non trouvé.',
        data: [],
      },
    },
  },
})
@ApiResponse({
  status: 500,
  description: 'Error 500: Server error.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 500,
        code: 'failure',
        title: 'InternalServerErrorException',
        message: 'Error 500: Server error.',
        data: [],
      },
    },
  },
})
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  // 📝 Créer un service
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un service',
    description: 'Crée un nouveau service dans le système.',
  })
  @ApiBody({
    type: CreateServiceDto,
    examples: {
      example1: {
        summary: 'Service principal',
        value: {
          nom: 'Direction Générale',
          sigle: 'DG',
          type: 'ADMINISTRATIF',
          isActive: true,
          isVisible: true,
        },
      },
      example2: {
        summary: 'Sous-service',
        value: {
          nom: 'Service Informatique',
          sigle: 'SI',
          type: 'TECHNIQUE',
          parentId: 1,
          isActive: true,
          isVisible: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Service créé avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Création service',
          message: 'Service créé avec succès.',
          data: {
            id: 1,
            nom: 'Direction Générale',
            sigle: 'DG',
            parentId: null,
            idServiceParent: null,
            isActive: true,
            isDelete: false,
            isVisible: true,
            createdAt: '2026-02-10T10:00:00.000Z',
            updatedAt: '2026-02-10T10:00:00.000Z',
          },
        },
      },
    },
  })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  // 📋 Liste de tous les services
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liste des services avec filtres et pagination',
    description: 'Récupère la liste des services avec possibilité de filtrer et paginer les résultats.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de la page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page (0 = tous)', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche globale (nom, sigle)', example: 'Direction' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrer par type de service', example: 'ADMINISTRATIF' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrer par statut actif/inactif', type: Boolean, example: true })
  @ApiQuery({ name: 'isDelete', required: false, description: 'Filtrer les services supprimés logiquement', type: Boolean, example: false })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filtrer par ID du service parent', type: Number, example: 1 })
  @ApiQuery({ name: 'isVisible', required: false, description: 'Filtrer par visibilité du service dans les transmissions', type: Boolean, example: true })
  @ApiResponse({
    status: 200,
    description: 'Liste des services récupérée avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Liste des services',
          message: '10 service(s) sur 25 récupéré(s) avec succès.',
          data: {
            services: [
              {
                id: 2,
                nom: 'Service Informatique',
                sigle: 'SI',
                type: 'TECHNIQUE',
                parentId: 1,
                idServiceParent: {
                  id: 1,
                  nom: 'Direction Générale',
                },
                isActive: true,
                isDelete: false,
                isVisible: true,
                createdAt: '2026-02-10T10:00:00.000Z',
                updatedAt: '2026-02-10T10:00:00.000Z',
              },
            ],
            pagination: {
              total: 25,
              page: 1,
              limit: 10,
              totalPages: 3,
              hasNextPage: true,
              hasPreviousPage: false,
            },
          },
        },
      },
    },
  })
  findAll(@Query() query: ServiceQueryDto) {
    return this.serviceService.findAll(query);
  }

  //  Récupérer un service par ID
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Détails d\'un service',
    description: 'Récupère les informations détaillées d\'un service par son ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du service à récupérer',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Service récupéré avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Détails du service',
          message: 'Service récupéré avec succès.',
          data: {
            id: 2,
            nom: 'Service Informatique',
            sigle: 'SI',
            type: 'TECHNIQUE',
            parentId: 1,
            idServiceParent: {
              id: 1,
              nom: 'Direction Générale',
            },
            isActive: true,
            isDelete: false,
            isVisible: true,
            createdAt: '2026-02-10T10:00:00.000Z',
            updatedAt: '2026-02-10T10:00:00.000Z',
          },
        },
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.findOne(id);
  }

  // ✏️ Mettre à jour un service
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour un service',
    description: 'Met à jour les informations d\'un service existant.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du service à mettre à jour',
    example: 1,
    type: Number,
  })
  @ApiBody({
    type: UpdateServiceDto,
    examples: {
      example1: {
        summary: 'Mise à jour complète',
        value: {
          nom: 'Direction Générale Modifiée',
          sigle: 'DGM',
          type: 'ADMINISTRATIF',
          parentId: 1,
          isActive: false,
          isVisible: true,
        },
      },
      example2: {
        summary: 'Masquer le service des transmissions',
        value: {
          isVisible: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Service mis à jour avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Mise à jour service',
          message: 'Service mis à jour avec succès.',
          data: {
            id: 1,
            nom: 'Direction Générale Modifiée',
            sigle: 'DGM',
            type: 'ADMINISTRATIF',
            parentId: null,
            idServiceParent: null,
            isActive: false,
            isDelete: false,
            isVisible: true,
            createdAt: '2026-02-10T10:00:00.000Z',
            updatedAt: '2026-02-10T11:00:00.000Z',
          },
        },
      },
    },
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateServiceDto: UpdateServiceDto) {
    return this.serviceService.update(id, updateServiceDto);
  }

  // 🗑️ Suppression logique
  @Delete(':id/soft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression logique d\'un service',
    description: 'Marque un service comme supprimé sans le supprimer définitivement de la base de données.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du service à supprimer logiquement',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Service supprimé logiquement avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Suppression logique',
          message: 'Service supprimé logiquement avec succès.',
          data: {
            id: 1,
          },
        },
      },
    },
  })
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.softDelete(id);
  }

  // 🗑️ Suppression définitive
  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression définitive d\'un service',
    description: 'Supprime définitivement un service de la base de données (impossible si le service a des enfants).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du service à supprimer définitivement',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Service supprimé définitivement avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Suppression définitive',
          message: 'Service supprimé définitivement avec succès.',
          data: {
            id: 1,
          },
        },
      },
    },
  })
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.hardDelete(id);
  }

  // 👶 Récupérer tous les enfants d'un service
  @Get(':id/children')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liste des enfants d\'un service',
    description: 'Récupère tous les services enfants d\'un service parent spécifique.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du service parent',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des enfants récupérée avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Liste des enfants du service',
          message: '5 enfant(s) récupéré(s) avec succès.',
          data: {
            parentServiceId: 1,
            parentServiceName: 'Direction Générale',
            children: [
              {
                id: 3,
                nom: 'Direction Administrative et Financière',
                sigle: 'DAF',
                type: 'ADMINISTRATIF',
                parentId: 1,
                isActive: true,
                isDelete: false,
                isVisible: true,
                createdAt: '2026-02-10T10:00:00.000Z',
                updatedAt: '2026-02-10T10:00:00.000Z',
              },
            ],
            totalChildren: 5,
          },
        },
      },
    },
  })
  getServiceChildren(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.getServiceChildren(id);
  }
}
