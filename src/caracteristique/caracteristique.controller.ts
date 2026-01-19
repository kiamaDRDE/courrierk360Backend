import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CaracteristiqueService } from './caracteristique.service';
import { CreateCaracteristiqueDto } from './dto/create-caracteristique.dto';
import { UpdateCaracteristiqueDto } from './dto/update-caracteristique.dto';
import { QueryCaracteristiqueDto } from './dto/query-caracteristique.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Caractéristique')
@Controller('caracteristiques')
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
export class CaracteristiqueController {
  constructor(private readonly caracteristiqueService: CaracteristiqueService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle caractéristique',
    description: 'Crée une nouvelle caractéristique pour une offre spécifique avec un type donné',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Caractéristique créée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'CARACTERISTIQUE_CREATED',
        title: 'Succès',
        message: 'Caractéristique créée avec succès',
        data: {
          id: 1,
          offreId: 1,
          type: 'DUREE_MOYENNE',
          onNet: 180.50,
          offNet: 145.75,
          international: 95.25,
          roaming: 120.80,
          createdAt: '2025-01-05T21:30:00.000Z',
          updatedAt: '2025-01-05T21:30:00.000Z',
          offre: {
            id: 1,
            nom: 'Forfait Premium 5G',
            typeOffre: 'Postpayé',
            operateur: {
              id: 1,
              nom: 'Orange Cameroun',
              code: 'ORC'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        code: 'BAD_REQUEST',
        title: 'Erreur de validation',
        message: 'Les données fournies ne sont pas valides',
        data: null
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Offre non trouvée',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'NOT_FOUND',
        title: 'Ressource non trouvée',
        message: 'Offre avec l\'ID 1 non trouvée',
        data: null
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Caractéristique déjà existante pour cette offre et ce type',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'CONFLICT',
        title: 'Conflit',
        message: 'Une caractéristique de type "DUREE_MOYENNE" existe déjà pour cette offre',
        data: null
      }
    }
  })
  async create(@Body() createCaracteristiqueDto: CreateCaracteristiqueDto) {
    return this.caracteristiqueService.create(createCaracteristiqueDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les caractéristiques',
    description: 'Récupère la liste paginée des caractéristiques avec filtres optionnels',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des caractéristiques récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'CARACTERISTIQUES_RETRIEVED',
        title: 'Succès',
        message: 'Caractéristiques récupérées avec succès',
        data: {
          items: [
            {
              id: 1,
              offreId: 1,
              type: 'DUREE_MOYENNE',
              onNet: 180.50,
              offNet: 145.75,
              international: 95.25,
              roaming: 120.80,
              createdAt: '2025-01-05T21:30:00.000Z',
              updatedAt: '2025-01-05T21:30:00.000Z',
              offre: {
                id: 1,
                nom: 'Forfait Premium 5G',
                typeOffre: 'Postpayé',
                operateur: {
                  id: 1,
                  nom: 'Orange Cameroun',
                  code: 'ORC'
                }
              }
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNextPage: true,
            hasPrevPage: false
          }
        }
      }
    }
  })
  async findAll(@Query() query: QueryCaracteristiqueDto) {
    return this.caracteristiqueService.findAll(query);
  }

  @Get('statistiques')
  @ApiOperation({
    summary: 'Obtenir les statistiques des caractéristiques',
    description: 'Récupère les statistiques globales des caractéristiques (moyennes, répartition par type, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques récupérées avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'STATISTICS_RETRIEVED',
        title: 'Succès',
        message: 'Statistiques récupérées avec succès',
        data: {
          totalRecords: 25,
          repartitionParType: {
            'DUREE_MOYENNE': 10,
            'QUALITE_SERVICE': 8,
            'COUVERTURE': 4,
            'DEBIT': 3
          },
          moyennes: {
            onNet: 165.30,
            offNet: 140.25,
            international: 88.15,
            roaming: 115.60
          },
          extremes: {
            maxOnNet: 300.00,
            minOnNet: 60.00
          }
        }
      }
    }
  })
  async getStatistics() {
    return this.caracteristiqueService.getStatistics();
  }

  @Get('offre/:offreId')
  @ApiOperation({
    summary: 'Récupérer les caractéristiques par offre',
    description: 'Récupère toutes les caractéristiques associées à une offre spécifique',
  })
  @ApiParam({
    name: 'offreId',
    description: 'ID de l\'offre',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Caractéristiques récupérées avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'CARACTERISTIQUES_BY_OFFRE_RETRIEVED',
        title: 'Succès',
        message: 'Caractéristiques récupérées avec succès',
        data: [
          {
            id: 1,
            offreId: 1,
            type: 'DUREE_MOYENNE',
            onNet: 180.50,
            offNet: 145.75,
            international: 95.25,
            roaming: 120.80,
            createdAt: '2025-01-05T21:30:00.000Z',
            updatedAt: '2025-01-05T21:30:00.000Z'
          },
          {
            id: 2,
            offreId: 1,
            type: 'QUALITE_SERVICE',
            onNet: 95.2,
            offNet: 87.3,
            international: 78.5,
            roaming: 82.1,
            createdAt: '2025-01-05T21:35:00.000Z',
            updatedAt: '2025-01-05T21:35:00.000Z'
          }
        ]
      }
    }
  })
  async findByOffre(@Param('offreId', ParseIntPipe) offreId: number) {
    return this.caracteristiqueService.findByOffre(offreId);
  }

  @Get('offre/:offreId/type/:type')
  @ApiOperation({
    summary: 'Récupérer une caractéristique par offre et type',
    description: 'Récupère la caractéristique spécifique d\'une offre pour un type donné',
  })
  @ApiParam({
    name: 'offreId',
    description: 'ID de l\'offre',
    example: 1,
    type: 'number',
  })
  @ApiParam({
    name: 'type',
    description: 'Type de caractéristique',
    example: 'DUREE_MOYENNE',
    enum: ['DUREE_MOYENNE', 'QUALITE_SERVICE', 'COUVERTURE', 'DEBIT'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Caractéristique récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'CARACTERISTIQUE_BY_OFFRE_TYPE_RETRIEVED',
        title: 'Succès',
        message: 'Caractéristique récupérée avec succès',
        data: {
          id: 1,
          offreId: 1,
          type: 'DUREE_MOYENNE',
          onNet: 180.50,
          offNet: 145.75,
          international: 95.25,
          roaming: 120.80,
          createdAt: '2025-01-05T21:30:00.000Z',
          updatedAt: '2025-01-05T21:30:00.000Z',
          offre: {
            id: 1,
            nom: 'Forfait Premium 5G',
            typeOffre: 'Postpayé',
            operateur: {
              id: 1,
              nom: 'Orange Cameroun',
              code: 'ORC'
            }
          }
        }
      }
    }
  })
  async findByOffreAndType(
    @Param('offreId', ParseIntPipe) offreId: number,
    @Param('type') type: string
  ) {
    return this.caracteristiqueService.findByOffreAndType(offreId, type);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une caractéristique par ID',
    description: 'Récupère les détails d\'une caractéristique spécifique',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la caractéristique',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Caractéristique récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'CARACTERISTIQUE_RETRIEVED',
        title: 'Succès',
        message: 'Caractéristique récupérée avec succès',
        data: {
          id: 1,
          offreId: 1,
          type: 'DUREE_MOYENNE',
          onNet: 180.50,
          offNet: 145.75,
          international: 95.25,
          roaming: 120.80,
          createdAt: '2025-01-05T21:30:00.000Z',
          updatedAt: '2025-01-05T21:30:00.000Z',
          offre: {
            id: 1,
            nom: 'Forfait Premium 5G',
            typeOffre: 'Postpayé',
            operateur: {
              id: 1,
              nom: 'Orange Cameroun',
              code: 'ORC'
            }
          }
        }
      }
    }
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.caracteristiqueService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour une caractéristique',
    description: 'Met à jour partiellement les informations d\'une caractéristique existante',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la caractéristique à modifier',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Caractéristique mise à jour avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'CARACTERISTIQUE_UPDATED',
        title: 'Succès',
        message: 'Caractéristique mise à jour avec succès',
        data: {
          id: 1,
          offreId: 1,
          type: 'DUREE_MOYENNE',
          onNet: 185.50,
          offNet: 150.75,
          international: 100.25,
          roaming: 125.80,
          createdAt: '2025-01-05T21:30:00.000Z',
          updatedAt: '2025-01-05T22:15:00.000Z',
          offre: {
            id: 1,
            nom: 'Forfait Premium 5G',
            typeOffre: 'Postpayé',
            operateur: {
              id: 1,
              nom: 'Orange Cameroun',
              code: 'ORC'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Caractéristique non trouvée',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'NOT_FOUND',
        title: 'Ressource non trouvée',
        message: 'Caractéristique avec l\'ID 1 non trouvée',
        data: null
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        code: 'BAD_REQUEST',
        title: 'Erreur de validation',
        message: 'Les données fournies ne sont pas valides',
        data: null
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Conflit de caractéristique',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'CONFLICT',
        title: 'Conflit',
        message: 'Une caractéristique de type "DUREE_MOYENNE" existe déjà pour cette offre',
        data: null
      }
    }
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCaracteristiqueDto: UpdateCaracteristiqueDto,
  ) {
    return this.caracteristiqueService.update(id, updateCaracteristiqueDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une caractéristique',
    description: 'Supprime définitivement une caractéristique',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la caractéristique à supprimer',
    example: 1,
    type: 'number',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Caractéristique supprimée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'CARACTERISTIQUE_DELETED',
        title: 'Succès',
        message: 'Caractéristique supprimée avec succès',
        data: {
          id: 1,
          offreId: 1,
          type: 'DUREE_MOYENNE',
          onNet: 180.50,
          offNet: 145.75,
          international: 95.25,
          roaming: 120.80,
          createdAt: '2025-01-05T21:30:00.000Z',
          updatedAt: '2025-01-05T21:30:00.000Z',
          offre: {
            id: 1,
            nom: 'Forfait Premium 5G',
            typeOffre: 'Postpayé',
            operateur: {
              id: 1,
              nom: 'Orange Cameroun',
              code: 'ORC'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Caractéristique non trouvée',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'NOT_FOUND',
        title: 'Ressource non trouvée',
        message: 'Caractéristique avec l\'ID 1 non trouvée',
        data: null
      }
    }
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.caracteristiqueService.remove(id);
  }
}
