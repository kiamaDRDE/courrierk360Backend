// src/correspondant/correspondant.controller.ts

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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CorrespondantService } from './correspondant.service';
import { CreateCorrespondantDto } from './dto/create-correspondant.dto';
import { UpdateCorrespondantDto } from './dto/update-correspondant.dto';
import { SearchPaginationQueryDto } from '../common/dto/search-pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Correspondants')
@Controller('correspondant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CorrespondantController {
  constructor(private readonly correspondantService: CorrespondantService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau correspondant',
    description: `
      Permet de créer un nouveau correspondant dans le système avec ses catégories associées.
      
      **Champs obligatoires :**
      - nom
      - telephone
      - categories (au moins une catégorie)
      - type
      
      **Exemple de requête :**
      \`\`\`json
      {
        "civilite": "M.",
        "nom": "Dupont Martin",
        "email": "martin.dupont@example.com",
        "telephone": "+33 1 23 45 67 89",
        "adresse": "123 Rue de la République, Paris",
        "categories": [1, 3, 5],
        "type": "ENTREPRISE",
        "matricule": "CORR-2026-001"
      }
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Le correspondant a été créé avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'created',
        title: 'Correspondant créé',
        message: 'Le correspondant a été créé avec succès.',
        data: {
          id: 1,
          civilite: 'M.',
          nom: 'Dupont Martin',
          email: 'martin.dupont@example.com',
          telephone: '+33 1 23 45 67 89',
          adresse: '123 Rue de la République, Paris',
          type: 'ENTREPRISE',
          matricule: 'CORR-2026-001',
          isDelete: false,
          createdAt: '2026-02-10T10:30:00.000Z',
          updatedAt: '2026-02-10T10:30:00.000Z',
          categories: [
            {
              id: 1,
              categorieId: 1,
              correspondantId: 1,
              categorie: {
                id: 1,
                nom: 'Fournisseur',
              },
            },
            {
              id: 2,
              categorieId: 3,
              correspondantId: 1,
              categorie: {
                id: 3,
                nom: 'Client',
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur de validation des données.',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        code: 'validation_error',
        title: 'Catégories invalides',
        message: 'Une ou plusieurs catégories sélectionnées n\'existent pas ou ont été supprimées.',
      },
    },
  })
  create(@Body() createDto: CreateCorrespondantDto) {
    return this.correspondantService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister tous les correspondants',
    description: `
      Récupère la liste paginée de tous les correspondants avec leurs catégories.
      
      **Paramètres de requête :**
      - \`page\` : Numéro de la page (défaut: 1, min: 1)
      - \`limit\` : Nombre d'éléments par page (défaut: 10, min: 1, max: 100)
      - \`search\` : Terme de recherche pour filtrer par nom, email, téléphone, type ou matricule
      
      **Exemples d'utilisation :**
      - Liste complète : \`GET /correspondant?page=1&limit=10\`
      - Avec recherche : \`GET /correspondant?search=dupont&page=1&limit=10\`
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de la page',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre d\'éléments par page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Terme de recherche',
    example: 'dupont',
  })
  @ApiQuery({
    name: 'categoryIds',
    required: false,
    type: [Number],
    description: 'Liste des IDs de catégories pour filtrer les correspondants',
    example: [1, 2, 3],
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des correspondants récupérée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Liste des correspondants',
        message: '2 correspondant(s) récupéré(s).',
        data: {
          items: [
            {
              id: 1,
              civilite: 'M.',
              nom: 'Dupont Martin',
              email: 'martin.dupont@example.com',
              telephone: '+33 1 23 45 67 89',
              adresse: '123 Rue de la République, Paris',
              type: 'ENTREPRISE',
              matricule: 'CORR-2026-001',
              isDelete: false,
              createdAt: '2026-02-10T10:00:00.000Z',
              updatedAt: '2026-02-10T10:00:00.000Z',
              categories: [
                {
                  categorie: {
                    id: 1,
                    nom: 'Fournisseur',
                  },
                },
              ],
            },
            {
              id: 2,
              civilite: 'Mme',
              nom: 'Bernard Sophie',
              email: 'sophie.bernard@example.com',
              telephone: '+33 6 12 34 56 78',
              adresse: '45 Avenue des Champs, Lyon',
              type: 'PARTICULIER',
              matricule: 'CORR-2026-002',
              isDelete: false,
              createdAt: '2026-02-10T11:00:00.000Z',
              updatedAt: '2026-02-10T11:00:00.000Z',
              categories: [
                {
                  categorie: {
                    id: 2,
                    nom: 'Client',
                  },
                },
              ],
            },
          ],
          pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 2,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            nextPage: null,
            previousPage: null,
            startIndex: 0,
            endIndex: 1,
          },
        },
      },
    },
  })
  findAll(@Query() query: SearchPaginationQueryDto) {
    return this.correspondantService.findAll(
      query.search,
      query.page,
      query.limit,
      query.categoryIds,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un correspondant par son ID',
    description: `
      Permet de récupérer les détails d'un correspondant spécifique avec ses catégories.
      
      **Exemple d'utilisation :**
      \`GET /correspondant/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID du correspondant',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Correspondant récupéré avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Correspondant récupéré',
        message: 'Les informations du correspondant ont été récupérées avec succès.',
        data: {
          id: 1,
          civilite: 'M.',
          nom: 'Dupont Martin',
          email: 'martin.dupont@example.com',
          telephone: '+33 1 23 45 67 89',
          adresse: '123 Rue de la République, Paris',
          type: 'ENTREPRISE',
          matricule: 'CORR-2026-001',
          isDelete: false,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T10:00:00.000Z',
          categories: [
            {
              categorie: {
                id: 1,
                nom: 'Fournisseur',
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Correspondant non trouvé.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Correspondant non trouvé',
        message: 'Aucun correspondant trouvé avec l\'ID 999.',
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.correspondantService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un correspondant',
    description: `
      Permet de modifier un correspondant existant et/ou ses catégories associées.
      
      **Note :** Si vous modifiez les catégories, toutes les anciennes associations seront remplacées par les nouvelles.
      
      **Exemple de requête :**
      \`\`\`json
      {
        "nom": "Dupont Martin (Modifié)",
        "email": "martin.nouveau@example.com",
        "categories": [2, 4]
      }
      \`\`\`
      
      **Exemple d'utilisation :**
      \`PATCH /correspondant/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID du correspondant à modifier',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Le correspondant a été modifié avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'updated',
        title: 'Correspondant modifié',
        message: 'Le correspondant a été modifié avec succès.',
        data: {
          id: 1,
          civilite: 'M.',
          nom: 'Dupont Martin (Modifié)',
          email: 'martin.nouveau@example.com',
          telephone: '+33 1 23 45 67 89',
          adresse: '123 Rue de la République, Paris',
          type: 'ENTREPRISE',
          matricule: 'CORR-2026-001',
          isDelete: false,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T14:30:00.000Z',
          categories: [
            {
              categorie: {
                id: 2,
                nom: 'Client',
              },
            },
            {
              categorie: {
                id: 4,
                nom: 'Partenaire',
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Correspondant non trouvé.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Correspondant non trouvé',
        message: 'Aucun correspondant trouvé avec l\'ID 999.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Le correspondant a été supprimé.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Correspondant supprimé',
        message: 'Le correspondant avec l\'ID 1 a été supprimé et ne peut pas être modifié.',
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCorrespondantDto,
  ) {
    return this.correspondantService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer logiquement un correspondant',
    description: `
      Permet de supprimer logiquement un correspondant (soft delete).
      Le correspondant sera marqué comme supprimé mais restera dans la base de données.
      
      **⚠️ Note :** Pour une suppression définitive, utilisez l'endpoint DELETE /correspondant/:id/permanent
      
      **Exemple d'utilisation :**
      \`DELETE /correspondant/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID du correspondant à supprimer logiquement',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Le correspondant a été supprimé logiquement avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'deleted',
        title: 'Correspondant supprimé',
        message: 'Le correspondant a été supprimé logiquement avec succès.',
        data: {
          id: 1,
          civilite: 'M.',
          nom: 'Dupont Martin',
          email: 'martin.dupont@example.com',
          telephone: '+33 1 23 45 67 89',
          adresse: '123 Rue de la République, Paris',
          type: 'ENTREPRISE',
          matricule: 'CORR-2026-001',
          isDelete: true,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T15:00:00.000Z',
          categories: [],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Correspondant non trouvé.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Correspondant non trouvé',
        message: 'Aucun correspondant trouvé avec l\'ID 999.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Le correspondant a déjà été supprimé.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Correspondant déjà supprimé',
        message: 'Le correspondant avec l\'ID 1 a déjà été supprimé.',
      },
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.correspondantService.remove(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({
    summary: 'Supprimer définitivement un correspondant',
    description: `
      Permet de supprimer définitivement un correspondant de la base de données (hard delete).
      
      **⚠️ ATTENTION :** Cette action est irréversible et supprime définitivement les données.
      
      **Restrictions :**
      - Le correspondant ne doit pas être utilisé par des courriers existants
      - Le correspondant ne doit pas être utilisé par des courriers de départ
      - Le correspondant ne doit pas être associé à des utilisateurs
      
      **Exemple d'utilisation :**
      \`DELETE /correspondant/1/permanent\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID du correspondant à supprimer définitivement',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Le correspondant a été supprimé définitivement avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'deleted',
        title: 'Correspondant supprimé définitivement',
        message: 'Le correspondant a été supprimé définitivement avec succès.',
        data: {
          id: 1,
          civilite: 'M.',
          nom: 'Dupont Martin',
          email: 'martin.dupont@example.com',
          telephone: '+33 1 23 45 67 89',
          adresse: '123 Rue de la République, Paris',
          type: 'ENTREPRISE',
          matricule: 'CORR-2026-001',
          isDelete: false,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Correspondant non trouvé.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Correspondant non trouvé',
        message: 'Aucun correspondant trouvé avec l\'ID 999.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Le correspondant est utilisé par des entités existantes.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Correspondant utilisé',
        message: 'Le correspondant ne peut pas être supprimé car il est utilisé par des courriers, courriers de départ ou utilisateurs existants.',
      },
    },
  })
  removePermanently(@Param('id', ParseIntPipe) id: number) {
    return this.correspondantService.removePermanently(id);
  }
}
