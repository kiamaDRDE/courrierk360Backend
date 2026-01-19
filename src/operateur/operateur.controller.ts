// src/operateur/operateur.controller.ts

import { Body, Controller, Get, Post, Patch, Delete, Param, Query, HttpCode, HttpStatus, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OperateurService } from './operateur.service';
import { CreateOperateurDto } from './dto/create-operateur.dto';
import { UpdateOperateurDto } from './dto/update-operateur.dto';
import { OperateurQueryDto } from './dto/operateur-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseApi } from '../../common/responseApi.dto';

@ApiTags('Operateur')
@Controller('operateur')
@UseGuards(JwtAuthGuard) // 🔒 Protéger toutes les routes avec JWT
@ApiBearerAuth('bearer') // 🔒 Toutes les routes sont sécurisées
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
        message: 'Données invalides.',
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
        message: 'Opérateur introuvable.',
        data: [],
      },
    },
  },
})
@ApiResponse({
  status: 409,
  description: 'Error 409: Conflict.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 409,
        code: 'failure',
        title: 'ConflictException',
        message: 'Un opérateur avec ce code existe déjà pour cette année.',
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
export class OperateurController {
  constructor(private readonly operateurService: OperateurService) {}

  // 🔐 API 1: Créer un opérateur
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un opérateur',
    description: 'Crée un nouvel opérateur. Un opérateur ne peut avoir qu\'un seul tarif par année.',
  })
  @ApiBody({
    type: CreateOperateurDto,
    examples: {
      example1: {
        summary: 'Exemple de création d\'opérateur',
        value: {
          nom: 'MTN Cameroon',
          code: 'MTN',
          description: 'Opérateur de télécommunication mobile leader au Cameroun',
          type: 'Mobile',
          serviceIds: [1, 2],
          anneeCreation: 1998,
          statut: 'Actif',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Opérateur créé avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Opérateur créé',
          message: 'L\'opérateur "MTN Cameroon" a été créé avec succès.',
          data: {
            id: 1,
            nom: 'MTN Cameroon',
            code: 'MTN',
            description: 'Opérateur de télécommunication mobile leader au Cameroun',
            type: 'Mobile',
            statut: 'Actif',
            anneeCreation: 1998,
            createdAt: '2025-12-31T09:00:00.000Z',
            updatedAt: '2025-12-31T09:00:00.000Z',
            services: [
              {
                id: 1,
                nom: 'Mobile',
              },
              {
                id: 2,
                nom: 'Internet',
              },
            ],
          },
        },
      },
    },
  })
  async createOperateur(@Body() createOperateurDto: CreateOperateurDto): Promise<ResponseApi<any>> {
    const result = await this.operateurService.createOperateur(createOperateurDto);
    // Le service retourne déjà un format complet, on le retourne directement
    return result;
  }

  // 🔐 API 2: Mettre à jour un opérateur
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour un opérateur',
    description: 'Met à jour les informations d\'un opérateur. Tous les champs sont optionnels.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'opérateur à mettre à jour',
    example: 1,
    type: Number,
  })
  @ApiBody({
    type: UpdateOperateurDto,
    examples: {
      example1: {
        summary: 'Exemple avec tous les champs',
        value: {
          nom: 'MTN Cameroon SA',
          code: 'MTN',
          description: 'Opérateur de télécommunication mobile et fixe',
          type: 'Mobile',
          serviceIds: [1, 3],
          anneeCreation: 1998,
          statut: 'Actif',
        },
      },
      example2: {
        summary: 'Exemple avec quelques champs seulement',
        value: {
          anneeCreation: 2000,
          statut: 'Inactif',
          serviceIds: [2],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Opérateur mis à jour avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Opérateur mis à jour',
          message: 'L\'opérateur "MTN Cameroon SA" a été mis à jour avec succès.',
          data: {
            id: 1,
            nom: 'MTN Cameroon SA',
            code: 'MTN',
            description: 'Opérateur de télécommunication mobile et fixe',
            type: 'Mobile',
            statut: 'Actif',
            anneeCreation: 1998,
            createdAt: '2025-12-31T09:00:00.000Z',
            updatedAt: '2025-12-31T09:30:00.000Z',
            services: [
              {
                id: 1,
                nom: 'Mobile',
              },
              {
                id: 3,
                nom: 'Fixe',
              },
            ],
          },
        },
      },
    },
  })
  async updateOperateur(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOperateurDto: UpdateOperateurDto,
  ): Promise<ResponseApi<any>> {
    const result = await this.operateurService.updateOperateur(id, updateOperateurDto);
    return result;
  }

  // 🔐 API 3: Supprimer un opérateur
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un opérateur',
    description: 'Supprime un opérateur par son ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'opérateur à supprimer',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Opérateur supprimé avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'OPERATEUR_DELETED',
          title: 'Opérateur supprimé avec succès',
          message: 'L\'opérateur a été supprimé avec succès',
          data: {
            id: 1,
            nom: 'MTN Cameroon SA',
            deletedAt: '2025-01-05T10:30:00.000Z'
          }
        }
      }
    }
  })
  async deleteOperateur(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<any>> {
    const result = await this.operateurService.deleteOperateur(id);
    return result;
  }

  // 🔐 API 4: Lister les opérateurs avec pagination et filtres
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lister les opérateurs',
    description: 'Récupère la liste des opérateurs avec pagination et filtres. Utilisez limit=0 pour récupérer tous les opérateurs.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Numéro de la page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Nombre d\'éléments par page (0 = tous)' })
  @ApiQuery({ name: 'nom', required: false, type: String, example: 'MTN', description: 'Filtrer par nom (recherche partielle)' })
  @ApiQuery({ name: 'code', required: false, type: String, example: 'MTN', description: 'Filtrer par code' })
  @ApiQuery({ name: 'type', required: false, type: String, example: 'Mobile', description: 'Filtrer par type' })
  @ApiQuery({ name: 'service', required: false, type: String, example: '1,2', description: 'Filtrer par IDs de services (ex: "1" pour un seul, "1,2,3" pour plusieurs, ou "[1,2,3]" en JSON)' })
  @ApiQuery({ name: 'statut', required: false, type: String, example: 'Actif', description: 'Filtrer par statut' })
  @ApiQuery({ name: 'anneeCreation', required: false, type: Number, example: 1995, description: 'Filtrer par année de création' })
  @ApiQuery({ name: 'annee', required: false, type: Number, example: 2025, description: 'Filtrer par année' })
  @ApiResponse({
    status: 200,
    description: 'Liste des opérateurs récupérée avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Liste des opérateurs',
          message: '2 opérateur(s) récupéré(s) sur 2 au total.',
          data: {
            operateurs: [
              {
                id: 1,
                nom: 'MTN Cameroon',
                code: 'MTN',
                description: 'Opérateur de télécommunication mobile',
                type: 'Mobile',
                statut: 'Actif',
                anneeCreation: 1998,
                createdAt: '2025-12-31T09:00:00.000Z',
                updatedAt: '2025-12-31T09:00:00.000Z',
                services: [
                  {
                    id: 1,
                    nom: 'Mobile',
                  },
                ],
              },
              {
                id: 2,
                nom: 'Orange Cameroun',
                code: 'ORANGE',
                description: 'Opérateur de télécommunication mobile et internet',
                type: 'Mobile',
                statut: 'Actif',
                anneeCreation: 1999,
                createdAt: '2025-12-31T09:00:00.000Z',
                updatedAt: '2025-12-31T09:00:00.000Z',
                services: [
                  {
                    id: 1,
                    nom: 'Mobile',
                  },
                  {
                    id: 2,
                    nom: 'Internet',
                  },
                ],
              },
            ],
            pagination: {
              total: 2,
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
  async listOperateurs(@Query() query: OperateurQueryDto): Promise<ResponseApi<any>> {
    const result = await this.operateurService.listOperateurs(query);
    return result;
  }

  // 🔐 API 5: Afficher les détails d'un opérateur
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Détails d\'un opérateur',
    description: 'Récupère toutes les informations d\'un opérateur spécifique par son ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de l\'opérateur',
    example: 1,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Détails de l\'opérateur récupérés avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Détails de l\'opérateur',
          message: 'Informations de l\'opérateur "MTN Cameroon" récupérées avec succès.',
          data: {
            id: 1,
            nom: 'MTN Cameroon',
            code: 'MTN',
            description: 'Opérateur de télécommunication mobile leader au Cameroun',
            type: 'Mobile',
            statut: 'Actif',
            anneeCreation: 1998,
            createdAt: '2025-12-31T09:00:00.000Z',
            updatedAt: '2025-12-31T09:00:00.000Z',
            services: [
              {
                id: 1,
                nom: 'Mobile',
              },
              {
                id: 2,
                nom: 'Internet',
              },
            ],
          },
        },
      },
    },
  })
  async getOperateurById(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<any>> {
    const result = await this.operateurService.getOperateurById(id);
    return result;
  }
}
