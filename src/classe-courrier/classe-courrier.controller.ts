// src/classe-courrier/classe-courrier.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClasseCourrierService } from './classe-courrier.service';
import { CreateClasseCourrierDto } from './dto/create-classe-courrier.dto';
import { UpdateClasseCourrierDto } from './dto/update-classe-courrier.dto';
import { SearchPaginationQueryDto } from '../common/dto/search-pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Classes de Courrier')
@Controller('classe-courrier')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ClasseCourrierController {
  constructor(private readonly classeCourrierService: ClasseCourrierService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle classe de courrier',
    description: `
      Permet de créer une nouvelle classe de courrier dans le système.
      Le nom doit être unique.
      
      **Exemple de requête :**
      \`\`\`json
      {
        "nom": "Courrier Administratif"
      }
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'La classe de courrier a été créée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'created',
        title: 'Classe de courrier créée',
        message: 'La classe de courrier a été créée avec succès.',
        data: {
          id: 1,
          nom: 'Courrier Administratif',
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
    description: 'Une classe de courrier avec ce nom existe déjà.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Classe de courrier existante',
        message: 'Une classe de courrier avec le nom "Courrier Administratif" existe déjà.',
      },
    },
  })
  create(@Body() createDto: CreateClasseCourrierDto) {
    return this.classeCourrierService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister toutes les classes de courrier',
    description: `
      Récupère la liste paginée de toutes les classes de courrier.
      
      **Paramètres de requête :**
      - \`page\` : Numéro de la page (défaut: 1, min: 1)
      - \`limit\` : Nombre d'éléments par page (défaut: 10, min: 1, max: 100)
      - \`search\` : Terme de recherche pour filtrer par nom
      
      **Exemples d'utilisation :**
      - Liste complète : \`GET /classe-courrier?page=1&limit=10\`
      - Avec recherche : \`GET /classe-courrier?search=admin&page=1&limit=10\`
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
    example: 'administratif',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des classes de courrier récupérée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Liste des classes de courrier',
        message: '3 classe(s) de courrier récupérée(s).',
        data: {
          items: [
            {
              id: 1,
              nom: 'Courrier Administratif',
              createdAt: '2026-02-10T10:00:00.000Z',
              updatedAt: '2026-02-10T10:00:00.000Z',
            },
            {
              id: 2,
              nom: 'Courrier Confidentiel',
              createdAt: '2026-02-10T11:00:00.000Z',
              updatedAt: '2026-02-10T11:00:00.000Z',
            },
            {
              id: 3,
              nom: 'Courrier Urgent',
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
    return this.classeCourrierService.findAll(
      query.search,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une classe de courrier par son ID',
    description: `
      Permet de récupérer les détails d'une classe de courrier spécifique.
      
      **Exemple d'utilisation :**
      \`GET /classe-courrier/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la classe de courrier',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Classe de courrier récupérée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Classe de courrier récupérée',
        message: 'Les informations de la classe de courrier ont été récupérées avec succès.',
        data: {
          id: 1,
          nom: 'Courrier Administratif',
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Classe de courrier non trouvée.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Classe de courrier non trouvée',
        message: 'Aucune classe de courrier trouvée avec l\'ID 999.',
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.classeCourrierService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour une classe de courrier',
    description: `
      Permet de modifier le nom d'une classe de courrier existante.
      Le nouveau nom doit être unique.
      
      **Exemple de requête :**
      \`\`\`json
      {
        "nom": "Courrier Administratif Modifié"
      }
      \`\`\`
      
      **Exemple d'utilisation :**
      \`PATCH /classe-courrier/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la classe de courrier à modifier',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'La classe de courrier a été modifiée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'updated',
        title: 'Classe de courrier modifiée',
        message: 'La classe de courrier a été modifiée avec succès.',
        data: {
          id: 1,
          nom: 'Courrier Administratif Modifié',
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T14:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Classe de courrier non trouvée.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Classe de courrier non trouvée',
        message: 'Aucune classe de courrier trouvée avec l\'ID 999.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Une classe de courrier avec ce nom existe déjà.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Nom déjà utilisé',
        message: 'Une classe de courrier avec le nom "Courrier Confidentiel" existe déjà.',
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateClasseCourrierDto,
  ) {
    return this.classeCourrierService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une classe de courrier',
    description: `
      Permet de supprimer définitivement une classe de courrier du système.
      
      **⚠️ Attention :** Cette action est irréversible.
      
      **Exemple d'utilisation :**
      \`DELETE /classe-courrier/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la classe de courrier à supprimer',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'La classe de courrier a été supprimée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'deleted',
        title: 'Classe de courrier supprimée',
        message: 'La classe de courrier a été supprimée avec succès.',
        data: {
          id: 1,
          nom: 'Courrier Administratif',
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Classe de courrier non trouvée.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Classe de courrier non trouvée',
        message: 'Aucune classe de courrier trouvée avec l\'ID 999.',
      },
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.classeCourrierService.remove(id);
  }
}
