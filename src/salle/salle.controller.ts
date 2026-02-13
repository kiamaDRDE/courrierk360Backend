// src/salle/salle.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { SalleService } from './salle.service';
import { CreateSalleDto } from './dto/create-salle.dto';
import { UpdateSalleDto } from './dto/update-salle.dto';
import { SalleQueryDto } from './dto/salle-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Salle')
@Controller('salle')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
        message: 'Une salle avec ce nom existe déjà.',
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
        message: 'Salle non trouvée.',
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
export class SalleController {
  constructor(private readonly salleService: SalleService) {}

  // 📝 Créer une salle
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une salle',
    description: 'Crée une nouvelle salle dans le système.',
  })
  @ApiBody({
    type: CreateSalleDto,
    examples: {
      example1: {
        summary: 'Salle active',
        value: {
          nom: 'Salle Archive Centrale',
          isActive: true,
        },
      },
      example2: {
        summary: 'Salle inactive',
        value: {
          nom: 'Salle Annexe',
          isActive: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Salle créée avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Création salle',
          message: 'Salle créée avec succès.',
          data: {
            id: 1,
            nom: 'Salle Archive Centrale',
            isActive: true,
            isDelete: false,
            createdAt: '2026-02-10T10:00:00.000Z',
            updatedAt: '2026-02-10T10:00:00.000Z',
          },
        },
      },
    },
  })
  create(@Body() createSalleDto: CreateSalleDto) {
    return this.salleService.create(createSalleDto);
  }

  // 📋 Liste de toutes les salles
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liste des salles avec filtres et pagination',
    description: 'Récupère la liste des salles avec possibilité de filtrer et paginer les résultats.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de la page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page (0 = tous)', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche globale (nom)', example: 'Archive' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrer par statut actif/inactif', type: Boolean, example: true })
  @ApiQuery({ name: 'isDelete', required: false, description: 'Filtrer les salles supprimées logiquement', type: Boolean, example: false })
  @ApiResponse({
    status: 200,
    description: 'Liste des salles récupérée avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Liste des salles',
          message: '10 salle(s) sur 25 récupérée(s) avec succès.',
          data: {
            salles: [
              {
                id: 1,
                nom: 'Salle Archive Centrale',
                isActive: true,
                isDelete: false,
                createdAt: '2026-02-10T10:00:00.000Z',
                updatedAt: '2026-02-10T10:00:00.000Z',
              },
              {
                id: 2,
                nom: 'Salle Annexe',
                isActive: true,
                isDelete: false,
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
  findAll(@Query() query: SalleQueryDto) {
    return this.salleService.findAll(query);
  }

  // 🔍 Récupérer une salle par ID
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Détails d\'une salle',
    description: 'Récupère les informations détaillées d\'une salle par son ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la salle à récupérer',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Salle récupérée avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Détails de la salle',
          message: 'Salle récupérée avec succès.',
          data: {
            id: 1,
            nom: 'Salle Archive Centrale',
            isActive: true,
            isDelete: false,
            createdAt: '2026-02-10T10:00:00.000Z',
            updatedAt: '2026-02-10T10:00:00.000Z',
          },
        },
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salleService.findOne(id);
  }

  // ✏️ Mettre à jour une salle
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour une salle',
    description: 'Met à jour les informations d\'une salle existante.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la salle à mettre à jour',
    example: 1,
    type: Number,
  })
  @ApiBody({
    type: UpdateSalleDto,
    examples: {
      example1: {
        summary: 'Mise à jour du nom',
        value: {
          nom: 'Salle Archive Principale',
        },
      },
      example2: {
        summary: 'Désactivation de la salle',
        value: {
          isActive: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Salle mise à jour avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Mise à jour salle',
          message: 'Salle mise à jour avec succès.',
          data: {
            id: 1,
            nom: 'Salle Archive Principale',
            isActive: true,
            isDelete: false,
            createdAt: '2026-02-10T10:00:00.000Z',
            updatedAt: '2026-02-10T11:00:00.000Z',
          },
        },
      },
    },
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSalleDto: UpdateSalleDto) {
    return this.salleService.update(id, updateSalleDto);
  }

  // 🗑️ Suppression logique
  @Delete(':id/soft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression logique d\'une salle',
    description: 'Marque une salle comme supprimée sans la supprimer définitivement de la base de données.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la salle à supprimer logiquement',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Salle supprimée logiquement avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Suppression logique',
          message: 'Salle supprimée logiquement avec succès.',
          data: {
            id: 1,
          },
        },
      },
    },
  })
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.salleService.softDelete(id);
  }

  // 🗑️ Suppression définitive
  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression définitive d\'une salle',
    description: 'Supprime définitivement une salle de la base de données.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la salle à supprimer définitivement',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Salle supprimée définitivement avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Suppression définitive',
          message: 'Salle supprimée définitivement avec succès.',
          data: {
            id: 1,
          },
        },
      },
    },
  })
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.salleService.hardDelete(id);
  }
}
