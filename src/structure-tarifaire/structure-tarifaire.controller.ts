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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiNotFoundResponse } from '@nestjs/swagger';
import { StructureTarifaireService } from './structure-tarifaire.service';
import { CreateStructureTarifaireDto } from './dto/create-structure-tarifaire.dto';
import { UpdateStructureTarifaireDto } from './dto/update-structure-tarifaire.dto';
import { QueryStructureTarifaireDto } from './dto/query-structure-tarifaire.dto';
import { UpdateMultipleStructureTarifaireDto } from './dto/update-multiple-structure-tarifaire.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Structures tarifaires')
@Controller('structure-tarifaire')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StructureTarifaireController {
  constructor(
    private readonly structureTarifaireService: StructureTarifaireService,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Créer une ou plusieurs structures tarifaires',
    description: 'Crée une nouvelle structure tarifaire ou plusieurs structures tarifaires en une fois. Accepte soit un objet simple soit un tableau d\'objets. Tous les noms doivent être uniques.',
  })
  @ApiBody({
    type: CreateStructureTarifaireDto,
    description: 'Données pour créer une ou plusieurs structures tarifaires',
    examples: {
      multiple: {
        summary: 'Création de plusieurs structures tarifaires',
        value: [
          {
            nom: 'Tarification Standard',
            estObligatoire: true
          },
          {
            nom: 'Tarification Premium',
            estObligatoire: false
          },
          {
            nom: 'Tarification Basic',
            estObligatoire: false
            // estObligatoire non renseigné = false par défaut
          }
        ]
      },
      single: {
        summary: 'Création d\'une seule structure tarifaire',
        value: {
          nom: 'Tarification Standard',
          estObligatoire: true
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Structure(s) tarifaire(s) créée(s) avec succès',
    examples: {
      multiple: {
        summary: 'Réponse pour plusieurs structures tarifaires créées',
        value: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Structures créées',
          message: '3 structure(s) tarifaire(s) créée(s) avec succès.',
          data: [
            {
              id: 1,
              nom: 'Tarification Standard',
              estObligatoire: true,
              createdAt: '2025-12-31T14:30:00.000Z',
              updatedAt: '2025-12-31T14:30:00.000Z',
            },
            {
              id: 2,
              nom: 'Tarification Premium',
              estObligatoire: false,
              createdAt: '2025-12-31T14:30:00.000Z',
              updatedAt: '2025-12-31T14:30:00.000Z',
            },
            {
              id: 3,
              nom: 'Tarification Basic',
              estObligatoire: false,
              createdAt: '2025-12-31T14:30:00.000Z',
              updatedAt: '2025-12-31T14:30:00.000Z',
            }
          ],
        }
      },
      single: {
        summary: 'Réponse pour une seule structure tarifaire créée',
        value: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Structure créée',
          message: 'Structure tarifaire "Tarification Standard" créée avec succès.',
          data: {
            id: 1,
            nom: 'Tarification Standard',
            estObligatoire: true,
            createdAt: '2025-12-31T14:30:00.000Z',
            updatedAt: '2025-12-31T14:30:00.000Z',
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 409,
    description: 'Une ou plusieurs structures avec ces noms existent déjà',
  })
  create(@Body() data: CreateStructureTarifaireDto | CreateStructureTarifaireDto[]) {
    return this.structureTarifaireService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les structures tarifaires avec filtres et pagination' })
  @ApiResponse({
    status: 200,
    description: 'Liste des structures tarifaires récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Liste des structures',
        message: '2 structure(s) tarifaire(s) sur 5 récupérée(s) avec succès.',
        data: {
          structures: [
            {
              id: 1,
              nom: 'Tarification Standard',
              estObligatoire: true,
              createdAt: '2025-12-31T14:30:00.000Z',
              updatedAt: '2025-12-31T14:30:00.000Z',
            },
            {
              id: 2,
              nom: 'Tarification Premium',
              estObligatoire: false,
              createdAt: '2025-12-31T14:25:00.000Z',
              updatedAt: '2025-12-31T14:25:00.000Z',
            },
          ],
          pagination: {
            total: 5,
            page: 1,
            limit: 2,
            totalPages: 3,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      },
    },
  })
  findAll(@Query() query: QueryStructureTarifaireDto) {
    return this.structureTarifaireService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une structure tarifaire par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Structure tarifaire récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Structure récupérée',
        message: 'Structure tarifaire "Tarification Standard" récupérée avec succès.',
        data: {
          id: 1,
          nom: 'Tarification Standard',
          estObligatoire: true,
          createdAt: '2025-12-31T14:30:00.000Z',
          updatedAt: '2025-12-31T14:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Structure tarifaire introuvable',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.structureTarifaireService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une structure tarifaire' })
  @ApiResponse({
    status: 200,
    description: 'Structure tarifaire mise à jour avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Structure mise à jour',
        message: 'Structure tarifaire "Tarification Premium" mise à jour avec succès.',
        data: {
          id: 1,
          nom: 'Tarification Premium',
          estObligatoire: false,
          createdAt: '2025-12-31T14:30:00.000Z',
          updatedAt: '2025-12-31T14:35:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Structure tarifaire introuvable',
  })
  @ApiResponse({
    status: 409,
    description: 'Une structure avec ce nom existe déjà',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStructureTarifaireDto: UpdateStructureTarifaireDto,
  ) {
    return this.structureTarifaireService.update(id, updateStructureTarifaireDto);
  }

  @Patch()
  @ApiOperation({ 
    summary: 'Mettre à jour plusieurs structures tarifaires',
    description: 'Met à jour plusieurs structures tarifaires en une seule opération. Chaque structure doit avoir un ID valide.',
  })
  @ApiBody({
    type: UpdateMultipleStructureTarifaireDto,
    description: 'Données pour mettre à jour plusieurs structures tarifaires',
    examples: {
      multiple: {
        summary: 'Mise à jour de plusieurs structures tarifaires',
        value: {
          structures: [
            {
              id: 1,
              nom: 'Tarification Standard Modifiée',
              estObligatoire: true
            },
            {
              id: 2,
              nom: 'Tarification Premium Modifiée',
              estObligatoire: false
            },
            {
              id: 3,
              estObligatoire: true
              // nom non renseigné = pas de modification du nom
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Structures tarifaires mises à jour avec succès',
    examples: {
      multiple: {
        summary: 'Réponse pour plusieurs structures tarifaires mises à jour',
        value: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Structures mises à jour',
          message: '3 structure(s) tarifaire(s) mise(s) à jour avec succès.',
          data: [
            {
              id: 1,
              nom: 'Tarification Standard Modifiée',
              estObligatoire: true,
              createdAt: '2025-12-31T14:30:00.000Z',
              updatedAt: '2026-01-05T15:45:00.000Z',
            },
            {
              id: 2,
              nom: 'Tarification Premium Modifiée',
              estObligatoire: false,
              createdAt: '2025-12-31T14:30:00.000Z',
              updatedAt: '2026-01-05T15:45:00.000Z',
            },
            {
              id: 3,
              nom: 'Tarification Basic',
              estObligatoire: true,
              createdAt: '2025-12-31T14:30:00.000Z',
              updatedAt: '2026-01-05T15:45:00.000Z',
            }
          ],
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Une ou plusieurs structures tarifaires introuvables',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflit de noms avec des structures existantes',
  })
  updateMultiple(@Body() updateData: UpdateMultipleStructureTarifaireDto) {
    return this.structureTarifaireService.updateMultiple(updateData);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Supprimer une structure tarifaire',
    description: 'Supprime une structure tarifaire. Les structures marquées comme obligatoires (estObligatoire = true) ne peuvent pas être supprimées. Il faut d\'abord modifier estObligatoire à false avant de pouvoir les supprimer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Structure tarifaire supprimée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Structure supprimée',
        message: 'Structure tarifaire "Tarification Standard" supprimée avec succès.',
        data: {
          id: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Impossible de supprimer une structure obligatoire',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'Impossible de supprimer la structure tarifaire "Tarification Obligatoire" car elle est marquée comme obligatoire. Veuillez d\'abord modifier le champ estObligatoire à false avant de pouvoir la supprimer.',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Structure tarifaire introuvable',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.structureTarifaireService.remove(id);
  }
}
