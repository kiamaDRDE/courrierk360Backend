// src/coffre/coffre.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CoffreService } from './coffre.service';
import { CreateMultipleCoffresDto } from './dto/create-multiple-coffres.dto';
import { UpdateCoffreDto } from './dto/update-coffre.dto';
import { CoffreQueryDto } from './dto/coffre-query.dto';
import { GroupedCoffreQueryDto } from './dto/grouped-coffre-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Coffre')
@Controller('coffre')
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
        message: 'Un coffre avec ce nom existe déjà.',
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
        message: 'Coffre non trouvé.',
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
export class CoffreController {
  constructor(private readonly coffreService: CoffreService) {}

  // 📝 Créer plusieurs coffres dans une salle
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer plusieurs coffres dans une salle',
    description: 'Crée plusieurs coffres dans une salle en une seule requête.',
  })
  @ApiBody({
    type: CreateMultipleCoffresDto,
    examples: {
      example1: {
        summary: 'Création de 3 coffres',
        value: {
          idSalle: 1,
          coffres: [
            { nom: 'Coffre A1', tailleMaximale: 20, isActive: true },
            { nom: 'Coffre A2', tailleMaximale: 25, isActive: true },
            { nom: 'Coffre A3', isActive: false },
          ],
        },
      },
      example2: {
        summary: 'Création avec valeurs par défaut',
        value: {
          idSalle: 2,
          coffres: [
            { nom: 'Coffre B1' },
            { nom: 'Coffre B2', isActive: true },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Coffres créés avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Création coffres',
          message: '3 coffre(s) créé(s) avec succès.',
          data: {
            idSalle: 1,
            coffres: [
              {
                id: 1,
                nom: 'Coffre A1',
                nombrePlaceActuelle: 0,
                tailleMaximale: 20,
                idSalle: 1,
                isActive: true,
                isDelete: false,
                createdAt: '2026-02-10T10:00:00.000Z',
                updatedAt: '2026-02-10T10:00:00.000Z',
              },
              {
                id: 2,
                nom: 'Coffre A2',
                nombrePlaceActuelle: 0,
                tailleMaximale: 25,
                idSalle: 1,
                isActive: true,
                isDelete: false,
                createdAt: '2026-02-10T10:00:00.000Z',
                updatedAt: '2026-02-10T10:00:00.000Z',
              },
              {
                id: 3,
                nom: 'Coffre A3',
                nombrePlaceActuelle: 0,
                tailleMaximale: 20,
                idSalle: 1,
                isActive: true,
                isDelete: false,
                createdAt: '2026-02-10T10:00:00.000Z',
                updatedAt: '2026-02-10T10:00:00.000Z',
              },
            ],
            totalCreated: 3,
          },
        },
      },
    },
  })
  createMultiple(@Body() createMultipleCoffresDto: CreateMultipleCoffresDto) {
    return this.coffreService.createMultiple(createMultipleCoffresDto);
  }

  // � Liste des coffres groupés par salle
  @Get('grouped-by-salle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lister les coffres groupés par salle avec filtres et pagination',
    description: 'Récupère les coffres groupés par salle avec pagination à deux niveaux : pagination des salles et pagination des coffres dans chaque salle. Possibilité de filtrer par recherche, salle spécifique et statut actif.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche globale (nom de coffre)', example: 'Coffre A' })
  @ApiQuery({ name: 'idSalle', required: false, description: 'Filtrer par ID de salle spécifique', type: Number, example: 1 })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrer par statut actif/inactif des coffres', type: Boolean, example: true })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de la page pour les salles (défaut: 1)', type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre de salles par page (0 = toutes, défaut: 10)', type: Number, example: 10 })
  @ApiQuery({ name: 'coffrePage', required: false, description: 'Numéro de la page pour les coffres de chaque salle (défaut: 1)', type: Number, example: 1 })
  @ApiQuery({ name: 'coffreLimit', required: false, description: 'Nombre de coffres par page pour chaque salle (0 = tous, défaut: 10)', type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Coffres groupés récupérés avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Coffres groupés par salle',
          message: '15 coffre(s) dans 3 salle(s) récupéré(s) avec succès.',
          data: {
            salles: [
              {
                salle: {
                  id: 1,
                  nom: 'Salle A',
                  isActive: true,
                  isDelete: false,
                  createdAt: '2026-02-10T10:00:00.000Z',
                  updatedAt: '2026-02-10T10:00:00.000Z',
                },
                coffres: [
                  {
                    id: 1,
                    nom: 'Coffre A1',
                    nombrePlaceActuelle: 5,
                    tailleMaximale: 20,
                    idSalle: 1,
                    isActive: true,
                    isDelete: false,
                    createdAt: '2026-02-10T10:00:00.000Z',
                    updatedAt: '2026-02-10T10:00:00.000Z',
                  },
                  {
                    id: 2,
                    nom: 'Coffre A2',
                    nombrePlaceActuelle: 10,
                    tailleMaximale: 25,
                    idSalle: 1,
                    isActive: true,
                    isDelete: false,
                    createdAt: '2026-02-10T10:00:00.000Z',
                    updatedAt: '2026-02-10T10:00:00.000Z',
                  },
                ],
                totalCoffres: 2,
                placesTotales: 45,
                placesOccupees: 15,
              },
              {
                salle: {
                  id: 2,
                  nom: 'Salle B',
                  isActive: true,
                  isDelete: false,
                  createdAt: '2026-02-10T10:00:00.000Z',
                  updatedAt: '2026-02-10T10:00:00.000Z',
                },
                coffres: [
                  {
                    id: 3,
                    nom: 'Coffre B1',
                    nombrePlaceActuelle: 8,
                    tailleMaximale: 20,
                    idSalle: 2,
                    isActive: true,
                    isDelete: false,
                    createdAt: '2026-02-10T10:00:00.000Z',
                    updatedAt: '2026-02-10T10:00:00.000Z',
                  },
                ],
                totalCoffres: 1,
                placesTotales: 20,
                placesOccupees: 8,
              },
            ],
            resume: {
              totalSalles: 2,
              totalCoffres: 3,
              totalPlacesDisponibles: 65,
              totalPlacesOccupees: 23,
            },
          },
        },
      },
    },
  })
  findGroupedBySalle(@Query() query: GroupedCoffreQueryDto) {
    console.log('=== CONTROLLER - Paramètres reçus ===');
    console.log('Query brut:', query);
    console.log('isActive type:', typeof query.isActive);
    console.log('isActive value:', query.isActive);
    console.log('======================================');
    return this.coffreService.findGroupedBySalle(query);
  }

  // �📋 Liste de tous les coffres
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liste des coffres avec filtres et pagination',
    description: 'Récupère la liste des coffres avec possibilité de filtrer et paginer les résultats.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de la page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page (0 = tous)', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche globale (nom)', example: 'Coffre A' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrer par statut actif/inactif', type: Boolean, example: true })
  @ApiQuery({ name: 'isDelete', required: false, description: 'Filtrer les coffres supprimés logiquement', type: Boolean, example: false })
  @ApiQuery({ name: 'idSalle', required: false, description: 'Filtrer par ID de salle', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Liste des coffres récupérée avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Liste des coffres',
          message: '10 coffre(s) sur 25 récupéré(s) avec succès.',
          data: {
            coffres: [
              {
                id: 1,
                nom: 'Coffre A1',
                nombrePlaceActuelle: 5,
                tailleMaximale: 20,
                idSalle: 1,
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
  findAll(@Query() query: CoffreQueryDto) {
    return this.coffreService.findAll(query);
  }

  // 🔍 Récupérer un coffre par ID
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Détails d\'un coffre',
    description: 'Récupère les informations détaillées d\'un coffre par son ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du coffre à récupérer',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Coffre récupéré avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Détails du coffre',
          message: 'Coffre récupéré avec succès.',
          data: {
            id: 1,
            nom: 'Coffre A1',
            nombrePlaceActuelle: 5,
            tailleMaximale: 20,
            idSalle: 1,
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
    return this.coffreService.findOne(id);
  }

  // ✏️ Mettre à jour un coffre
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour un coffre',
    description: 'Met à jour les informations d\'un coffre existant.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du coffre à mettre à jour',
    example: 1,
    type: Number,
  })
  @ApiBody({
    type: UpdateCoffreDto,
    examples: {
      example1: {
        summary: 'Mise à jour du nom',
        value: {
          nom: 'Coffre A1-Modifié',
        },
      },
      example2: {
        summary: 'Mise à jour de la taille',
        value: {
          tailleMaximale: 30,
        },
      },
      example3: {
        summary: 'Mise à jour du nombre de places',
        value: {
          nombrePlaceActuelle: 10,
        },
      },
      example4: {
        summary: 'Mise à jour du statut actif',
        value: {
          isActive: false,
        },
      },
      example5: {
        summary: 'Mise à jour complète',
        value: {
          nom: 'Coffre B1',
          tailleMaximale: 25,
          nombrePlaceActuelle: 8,
          isActive: true,
          idSalle: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Coffre mis à jour avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Mise à jour coffre',
          message: 'Coffre mis à jour avec succès.',
          data: {
            id: 1,
            nom: 'Coffre A1-Modifié',
            nombrePlaceActuelle: 10,
            tailleMaximale: 30,
            idSalle: 1,
            isActive: true,
            isDelete: false,
            createdAt: '2026-02-10T10:00:00.000Z',
            updatedAt: '2026-02-10T11:00:00.000Z',
          },
        },
      },
    },
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCoffreDto: UpdateCoffreDto) {
    return this.coffreService.update(id, updateCoffreDto);
  }

  // 🗑️ Suppression logique
  @Delete(':id/soft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression logique d\'un coffre',
    description: 'Marque un coffre comme supprimé sans le supprimer définitivement de la base de données.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du coffre à supprimer logiquement',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Coffre supprimé logiquement avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Suppression logique',
          message: 'Coffre supprimé logiquement avec succès.',
          data: {
            id: 1,
          },
        },
      },
    },
  })
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.coffreService.softDelete(id);
  }

  // 🗑️ Suppression définitive
  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suppression définitive d\'un coffre',
    description: 'Supprime définitivement un coffre de la base de données.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID du coffre à supprimer définitivement',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Coffre supprimé définitivement avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'success',
          title: 'Suppression définitive',
          message: 'Coffre supprimé définitivement avec succès.',
          data: {
            id: 1,
          },
        },
      },
    },
  })
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.coffreService.hardDelete(id);
  }
}
