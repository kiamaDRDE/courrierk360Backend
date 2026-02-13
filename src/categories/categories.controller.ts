// src/categories/categories.controller.ts

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
import { CategoriesService } from './categories.service';
import { CreateCategoriesDto } from './dto/create-categories.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';
import { SearchPaginationQueryDto } from '../common/dto/search-pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Catégories')
@Controller('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle catégorie',
    description: `
      Permet de créer une nouvelle catégorie dans le système.
      Le nom doit être unique.
      
      **Exemple de requête :**
      \`\`\`json
      {
        "nom": "Fournisseur"
      }
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'La catégorie a été créée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'created',
        title: 'Catégorie créée',
        message: 'La catégorie a été créée avec succès.',
        data: {
          id: 1,
          nom: 'Fournisseur',
          isDelete: false,
          createdAt: '2026-02-10T10:30:00.000Z',
          updatedAt: '2026-02-10T10:30:00.000Z',
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
        title: 'Erreur de validation',
        message: 'Le nom est requis',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Une catégorie avec ce nom existe déjà.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Catégorie existante',
        message: 'Une catégorie avec le nom "Fournisseur" existe déjà.',
      },
    },
  })
  create(@Body() createDto: CreateCategoriesDto) {
    return this.categoriesService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister toutes les catégories',
    description: `
      Récupère la liste paginée de toutes les catégories.
      
      **Paramètres de requête :**
      - \`page\` : Numéro de la page (défaut: 1, min: 1)
      - \`limit\` : Nombre d'éléments par page (défaut: 10, min: 1, max: 100)
      - \`search\` : Terme de recherche pour filtrer par nom
      
      **Exemples d'utilisation :**
      - Liste complète : \`GET /categories?page=1&limit=10\`
      - Avec recherche : \`GET /categories?search=fournisseur&page=1&limit=10\`
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
    example: 'fournisseur',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des catégories récupérée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Liste des catégories',
        message: '3 catégorie(s) récupérée(s).',
        data: {
          items: [
            {
              id: 1,
              nom: 'Fournisseur',
              isDelete: false,
              createdAt: '2026-02-10T10:00:00.000Z',
              updatedAt: '2026-02-10T10:00:00.000Z',
            },
            {
              id: 2,
              nom: 'Client',
              isDelete: false,
              createdAt: '2026-02-10T11:00:00.000Z',
              updatedAt: '2026-02-10T11:00:00.000Z',
            },
            {
              id: 3,
              nom: 'Partenaire',
              isDelete: false,
              createdAt: '2026-02-10T12:00:00.000Z',
              updatedAt: '2026-02-10T12:00:00.000Z',
            },
          ],
          pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 3,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            nextPage: null,
            previousPage: null,
            startIndex: 0,
            endIndex: 2,
          },
        },
      },
    },
  })
  findAll(@Query() query: SearchPaginationQueryDto) {
    return this.categoriesService.findAll(
      query.search,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une catégorie par son ID',
    description: `
      Permet de récupérer les détails d'une catégorie spécifique.
      
      **Exemple d'utilisation :**
      \`GET /categories/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la catégorie',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Catégorie récupérée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Catégorie récupérée',
        message: 'Les informations de la catégorie ont été récupérées avec succès.',
        data: {
          id: 1,
          nom: 'Fournisseur',
          isDelete: false,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Catégorie non trouvée.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Catégorie non trouvée',
        message: 'Aucune catégorie trouvée avec l\'ID 999.',
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour une catégorie',
    description: `
      Permet de modifier le nom d'une catégorie existante.
      Le nouveau nom doit être unique.
      
      **Exemple de requête :**
      \`\`\`json
      {
        "nom": "Fournisseur Principal"
      }
      \`\`\`
      
      **Exemple d'utilisation :**
      \`PATCH /categories/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la catégorie à modifier',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'La catégorie a été modifiée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'updated',
        title: 'Catégorie modifiée',
        message: 'La catégorie a été modifiée avec succès.',
        data: {
          id: 1,
          nom: 'Fournisseur Principal',
          isDelete: false,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T14:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Catégorie non trouvée.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Catégorie non trouvée',
        message: 'Aucune catégorie trouvée avec l\'ID 999.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Une catégorie avec ce nom existe déjà ou la catégorie a été supprimée.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Nom déjà utilisé',
        message: 'Une catégorie avec le nom "Client" existe déjà.',
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCategoriesDto,
  ) {
    return this.categoriesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer logiquement une catégorie',
    description: `
      Permet de supprimer logiquement une catégorie (soft delete).
      La catégorie sera marquée comme supprimée mais restera dans la base de données.
      
      **⚠️ Note :** Pour une suppression définitive, utilisez l'endpoint DELETE /categories/:id/permanent
      
      **Exemple d'utilisation :**
      \`DELETE /categories/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la catégorie à supprimer logiquement',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'La catégorie a été supprimée logiquement avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'deleted',
        title: 'Catégorie supprimée',
        message: 'La catégorie a été supprimée logiquement avec succès.',
        data: {
          id: 1,
          nom: 'Fournisseur',
          isDelete: true,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T15:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Catégorie non trouvée.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Catégorie non trouvée',
        message: 'Aucune catégorie trouvée avec l\'ID 999.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'La catégorie a déjà été supprimée.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Catégorie déjà supprimée',
        message: 'La catégorie avec l\'ID 1 a déjà été supprimée.',
      },
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({
    summary: 'Supprimer définitivement une catégorie',
    description: `
      Permet de supprimer définitivement une catégorie de la base de données (hard delete).
      
      **⚠️ ATTENTION :** Cette action est irréversible et supprime définitivement les données.
      
      **Restrictions :**
      - La catégorie ne doit pas être utilisée par des correspondants existants
      
      **Exemple d'utilisation :**
      \`DELETE /categories/1/permanent\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la catégorie à supprimer définitivement',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'La catégorie a été supprimée définitivement avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'deleted',
        title: 'Catégorie supprimée définitivement',
        message: 'La catégorie a été supprimée définitivement avec succès.',
        data: {
          id: 1,
          nom: 'Fournisseur',
          isDelete: false,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Catégorie non trouvée.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Catégorie non trouvée',
        message: 'Aucune catégorie trouvée avec l\'ID 999.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'La catégorie est utilisée par des correspondants existants.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Catégorie utilisée',
        message: 'La catégorie ne peut pas être supprimée car elle est utilisée par des correspondants existants.',
      },
    },
  })
  removePermanently(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.removePermanently(id);
  }
}
