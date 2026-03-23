import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjetDto } from './dto/create.dto';
import { ListProjetQueryDto } from './dto/list.dto';
import { UpdateProjetDto } from './dto/update.dto';
import { ProjetService } from './projet.service';

@ApiTags('Projets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projets')
export class ProjetController {
  constructor(private readonly projetService: ProjetService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un projet',
    description: `Crée un projet.

Exemple:
\`\`\`json
{ "name": "Digitalisation courrier" }
\`\`\``,
  })
  @ApiBody({ type: CreateProjetDto })
  @ApiResponse({
    status: 201,
    description: 'Projet créé avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'created',
        title: 'Projet créé',
        message: 'Le projet a été créé avec succès.',
        data: {
          id: 1,
          name: 'Digitalisation courrier',
          createdAt: '2026-03-23T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur de validation.',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        code: 'validation_error',
        title: 'Erreur de validation',
        message: 'name est requis',
      },
    },
  })
  create(@Body() dto: CreateProjetDto) {
    return this.projetService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un projet' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du projet', example: 1 })
  @ApiBody({ type: UpdateProjetDto })
  @ApiResponse({
    status: 200,
    description: 'Projet mis à jour avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'updated',
        title: 'Projet mis à jour',
        message: 'Le projet a été mis à jour avec succès.',
        data: {
          id: 1,
          name: 'Digitalisation courrier (MAJ)',
          createdAt: '2026-03-23T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Projet non trouvé.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Projet non trouvé',
        message: "Aucun projet trouvé avec l'ID 999.",
      },
    },
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjetDto) {
    return this.projetService.update(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les projets' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de la page', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: "Nombre d'éléments par page",
    example: 10,
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche (id ou name)', example: 'digit' })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des projets.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Liste des projets',
        message: '2 projet(s) récupéré(s) avec succès.',
        data: {
          items: [
            { id: 2, name: 'Projet B', createdAt: '2026-03-23T11:00:00.000Z' },
            { id: 1, name: 'Projet A', createdAt: '2026-03-23T10:00:00.000Z' },
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
  list(@Query() query: ListProjetQueryDto) {
    return this.projetService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'un projet" })
  @ApiParam({ name: 'id', type: Number, description: 'ID du projet', example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Projet récupéré avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Projet récupéré',
        message: 'Les informations du projet ont été récupérées avec succès.',
        data: {
          id: 1,
          name: 'Projet A',
          createdAt: '2026-03-23T10:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Projet non trouvé.',
    schema: {
      example: {
        success: false,
        statusCode: 404,
        code: 'not_found',
        title: 'Projet non trouvé',
        message: "Aucun projet trouvé avec l'ID 999.",
      },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.projetService.findOne(id);
  }
}

