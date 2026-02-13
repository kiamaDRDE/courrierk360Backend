// src/type-courrier/type-courrier.controller.ts

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
import { TypeCourrierService } from './type-courrier.service';
import { CreateTypeCourrierDto } from './dto/create-type-courrier.dto';
import { UpdateTypeCourrierDto } from './dto/update-type-courrier.dto';
import { SearchPaginationQueryDto } from '../common/dto/search-pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Types de Courrier')
@Controller('type-courrier')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TypeCourrierController {
  constructor(private readonly typeCourrierService: TypeCourrierService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau type de courrier',
    description: `
      Permet de créer un nouveau type de courrier dans le système.
      Le nom doit être unique.
      
      **Exemple de requête :**
      \`\`\`json
      {
        "nom": "Courrier Entrant",
        "type": "ARRIVEE",
        "classeCourrier": "Courrier Administratif"
      }
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Le type de courrier a été créé avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'created',
        title: 'Type de courrier créé',
        message: 'Le type de courrier a été créé avec succès.',
        data: {
          id: 1,
          nom: 'Courrier Entrant',
          type: 'ARRIVEE',
          classeCourrier: 'Courrier Administratif',
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
        message: 'Le nom et le type sont requis',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Un type de courrier avec ce nom existe déjà.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Type de courrier existant',
        message: 'Un type de courrier avec le nom "Courrier Entrant" existe déjà.',
      },
    },
  })
  create(@Body() createDto: CreateTypeCourrierDto) {
    return this.typeCourrierService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister tous les types de courrier',
    description: `
      Récupère la liste paginée de tous les types de courrier.
      
      **Paramètres de requête :**
      - \`page\` : Numéro de la page (défaut: 1, min: 1)
      - \`limit\` : Nombre d'éléments par page (défaut: 10, min: 1, max: 100)
      - \`search\` : Terme de recherche pour filtrer par nom ou type
      - \`classeCourrier\` : Filtrer par classe de courrier
      
      **Exemples d'utilisation :**
      - Liste complète : \`GET /type-courrier?page=1&limit=10\`
      - Avec recherche : \`GET /type-courrier?search=entrant&page=1&limit=10\`
      - Par classe : \`GET /type-courrier?classeCourrier=Courrier Administratif&page=1\`
      - Combiné : \`GET /type-courrier?search=courrier&classeCourrier=Urgent&page=1&limit=20\`
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
    example: 'entrant',
  })
  @ApiQuery({
    name: 'classeCourrier',
    required: false,
    type: String,
    description: 'Filtrer par classe de courrier',
    example: 'Courrier Administratif',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des types de courrier récupérée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Liste des types de courrier',
        message: '3 type(s) de courrier récupéré(s).',
        data: {
          items: [
            {
              id: 1,
              nom: 'Courrier Entrant',
              type: 'ARRIVEE',
              classeCourrier: 'Courrier Administratif',
              isDelete: false,
              createdAt: '2026-02-10T10:00:00.000Z',
              updatedAt: '2026-02-10T10:00:00.000Z',
            },
            {
              id: 2,
              nom: 'Courrier Sortant',
              type: 'DEPART',
              classeCourrier: 'Courrier Administratif',
              isDelete: false,
              createdAt: '2026-02-10T11:00:00.000Z',
              updatedAt: '2026-02-10T11:00:00.000Z',
            },
            {
              id: 3,
              nom: 'Courrier Interne',
              type: 'INTERNE',
              classeCourrier: 'Courrier Confidentiel',
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
  findAll(
    @Query() query: SearchPaginationQueryDto,
    @Query('classeCourrier') classeCourrier?: string,
  ) {
    return this.typeCourrierService.findAll(
      query.search,
      classeCourrier,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un type de courrier par son ID',
    description: `
      Permet de récupérer les détails d'un type de courrier spécifique.
      
      **Exemple d'utilisation :**
      \`GET /type-courrier/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID du type de courrier',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Type de courrier récupéré avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Type de courrier récupéré',
        message: 'Les informations du type de courrier ont été récupérées avec succès.',
        data: {
          id: 1,
          nom: 'Courrier Entrant',
          type: 'ARRIVEE',
          classeCourrier: 'Courrier Administratif',
          isDelete: false,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Type de courrier non trouvé.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Type de courrier non trouvé',
        message: 'Aucun type de courrier trouvé avec l\'ID 999.',
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.typeCourrierService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un type de courrier',
    description: `
      Permet de modifier un type de courrier existant.
      Le nouveau nom doit être unique s'il est modifié.
      
      **Exemple de requête :**
      \`\`\`json
      {
        "nom": "Courrier Entrant Modifié",
        "type": "ARRIVEE",
        "classeCourrier": "Courrier Urgent"
      }
      \`\`\`
      
      **Exemple d'utilisation :**
      \`PATCH /type-courrier/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID du type de courrier à modifier',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Le type de courrier a été modifié avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'updated',
        title: 'Type de courrier modifié',
        message: 'Le type de courrier a été modifié avec succès.',
        data: {
          id: 1,
          nom: 'Courrier Entrant Modifié',
          type: 'ARRIVEE',
          classeCourrier: 'Courrier Urgent',
          isDelete: false,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T14:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Type de courrier non trouvé.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Type de courrier non trouvé',
        message: 'Aucun type de courrier trouvé avec l\'ID 999.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Un type de courrier avec ce nom existe déjà ou le type a été supprimé.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Nom déjà utilisé',
        message: 'Un type de courrier avec le nom "Courrier Sortant" existe déjà.',
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTypeCourrierDto,
  ) {
    return this.typeCourrierService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer logiquement un type de courrier',
    description: `
      Permet de supprimer logiquement un type de courrier (soft delete).
      Le type de courrier sera marqué comme supprimé mais restera dans la base de données.
      
      **⚠️ Note :** Pour une suppression définitive, utilisez l'endpoint DELETE /type-courrier/:id/permanent
      
      **Exemple d'utilisation :**
      \`DELETE /type-courrier/1\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID du type de courrier à supprimer logiquement',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Le type de courrier a été supprimé logiquement avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'deleted',
        title: 'Type de courrier supprimé',
        message: 'Le type de courrier a été supprimé logiquement avec succès.',
        data: {
          id: 1,
          nom: 'Courrier Entrant',
          type: 'ARRIVEE',
          classeCourrier: 'Courrier Administratif',
          isDelete: true,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T15:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Type de courrier non trouvé.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Type de courrier non trouvé',
        message: 'Aucun type de courrier trouvé avec l\'ID 999.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Le type de courrier a déjà été supprimé.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Type de courrier déjà supprimé',
        message: 'Le type de courrier avec l\'ID 1 a déjà été supprimé.',
      },
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.typeCourrierService.remove(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({
    summary: 'Supprimer définitivement un type de courrier',
    description: `
      Permet de supprimer définitivement un type de courrier de la base de données (hard delete).
      
      **⚠️ ATTENTION :** Cette action est irréversible et supprime définitivement les données.
      
      **Restrictions :**
      - Le type de courrier ne doit pas être utilisé par des courriers existants
      
      **Exemple d'utilisation :**
      \`DELETE /type-courrier/1/permanent\`
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID du type de courrier à supprimer définitivement',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Le type de courrier a été supprimé définitivement avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'deleted',
        title: 'Type de courrier supprimé définitivement',
        message: 'Le type de courrier a été supprimé définitivement avec succès.',
        data: {
          id: 1,
          nom: 'Courrier Entrant',
          type: 'ARRIVEE',
          classeCourrier: 'Courrier Administratif',
          isDelete: false,
          createdAt: '2026-02-10T10:00:00.000Z',
          updatedAt: '2026-02-10T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Type de courrier non trouvé.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Type de courrier non trouvé',
        message: 'Aucun type de courrier trouvé avec l\'ID 999.',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Le type de courrier est utilisé par des courriers existants.',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        code: 'conflict',
        title: 'Type de courrier utilisé',
        message: 'Le type de courrier ne peut pas être supprimé car il est utilisé par des courriers existants.',
      },
    },
  })
  removePermanently(@Param('id', ParseIntPipe) id: number) {
    return this.typeCourrierService.removePermanently(id);
  }
}
