import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParametreService } from './parametre.service';
import { CreateParametreDto, TypeParametre } from './dto/create-parametre.dto';
import { UpdateParametreDto } from './dto/update-parametre.dto';
import { QueryParametreDto } from './dto/query-parametre.dto';
import { ParametreResponseDto } from './dto/parametre-response.dto';
import { ResponseApi } from '../../common/responseApi.dto';

@ApiTags('Paramètres')
@Controller('parametres')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Token d\'authentification manquant ou invalide' })
@ApiForbiddenResponse({ description: 'Accès refusé - permissions insuffisantes' })
@ApiInternalServerErrorResponse({ description: 'Erreur interne du serveur' })
export class ParametreController {
  constructor(private readonly parametreService: ParametreService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Créer un nouveau paramètre',
    description: 'Crée un nouveau paramètre financier. Ce module gère exclusivement les paramètres de type (redevance FST, redevance de régulation, droit d\'entrée, coûts commerciaux).'
  })
  @ApiCreatedResponse({
    description: 'Paramètre créé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 201 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'ParametreCreated' },
        message: { type: 'string', example: 'Paramètre créé avec succès' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            type: { type: 'string', example: 'REGLEMENTAIRE' },
            redevanceFst: { type: 'number', example: 15000.00 },
            redevanceRegulation: { type: 'number', example: 25000.00 },
            droitEntree: { type: 'number', example: 50000.00 },
            coutsCommerciaux: { type: 'number', example: 35000.00 },
            createdAt: { type: 'string', example: '2026-01-05T12:00:00Z' },
            updatedAt: { type: 'string', example: '2026-01-05T12:00:00Z' }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Données de création invalides',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        code: { type: 'string', example: 'failure' },
        title: { type: 'string', example: 'BadRequestException' },
        message: { type: 'string', example: 'Erreur de validation des données' },
        data: {
          type: 'array',
          items: { type: 'string' },
          example: ['Le type est obligatoire', 'Le type doit être une valeur valide']
        }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Un paramètre de ce type existe déjà',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 409 },
        code: { type: 'string', example: 'failure' },
        title: { type: 'string', example: 'ConflictException' },
        message: { type: 'string', example: 'Un paramètre de type "REGLEMENTAIRE" existe déjà' },
        data: { type: 'array', example: [] }
      }
    }
  })
  async create(@Body() createParametreDto: CreateParametreDto): Promise<ResponseApi<ParametreResponseDto>> {
    const parametre = await this.parametreService.create(createParametreDto);
    return new ResponseApi(
      true,
      201,
      'success',
      'ParametreCreated',
      'Paramètre créé avec succès',
      parametre
    );
  }

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer la liste des paramètres',
    description: 'Récupère tous les paramètres financiers avec possibilité de filtrage par type et pagination.'
  })
  @ApiQuery({ name: 'type', required: false, enum: TypeParametre, description: 'Filtrer par type de paramètre' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre d\'éléments par page (défaut: 10)' })
  @ApiOkResponse({
    description: 'Liste des paramètres récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'ParametresFound' },
        message: { type: 'string', example: 'Liste des paramètres récupérée avec succès' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              type: { type: 'string', example: 'REGLEMENTAIRE' },
              redevanceFst: { type: 'number', example: 15000.00 },
              redevanceRegulation: { type: 'number', example: 25000.00 },
              droitEntree: { type: 'number', example: 50000.00 },
              coutsCommerciaux: { type: 'number', example: 35000.00 },
              createdAt: { type: 'string', example: '2026-01-05T12:00:00Z' },
              updatedAt: { type: 'string', example: '2026-01-05T12:00:00Z' }
            }
          }
        }
      }
    }
  })
  async findAll(@Query() queryDto: QueryParametreDto): Promise<ResponseApi<{
    parametres: ParametreResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    const result = await this.parametreService.findAll(queryDto);
    return new ResponseApi(
      true,
      200,
      'success',
      'ParametresFound',
      'Liste des paramètres récupérée avec succès',
      result
    );
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer un paramètre par ID',
    description: 'Récupère un paramètre financier spécifique par son identifiant unique.'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du paramètre' })
  @ApiOkResponse({
    description: 'Paramètre récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'ParametreFound' },
        message: { type: 'string', example: 'Paramètre récupéré avec succès' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            type: { type: 'string', example: 'REGLEMENTAIRE' },
            redevanceFst: { type: 'number', example: 15000.00 },
            redevanceRegulation: { type: 'number', example: 25000.00 },
            droitEntree: { type: 'number', example: 50000.00 },
            coutsCommerciaux: { type: 'number', example: 35000.00 },
            createdAt: { type: 'string', example: '2026-01-05T12:00:00Z' },
            updatedAt: { type: 'string', example: '2026-01-05T12:00:00Z' }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Paramètre non trouvé',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        code: { type: 'string', example: 'failure' },
        title: { type: 'string', example: 'NotFoundException' },
        message: { type: 'string', example: 'Paramètre avec l\'ID 1 non trouvé' },
        data: { type: 'array', example: [] }
      }
    }
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<ParametreResponseDto>> {
    const parametre = await this.parametreService.findOne(id);
    return new ResponseApi(
      true,
      200,
      'success',
      'ParametreFound',
      'Paramètre récupéré avec succès',
      parametre
    );
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour un paramètre',
    description: 'Met à jour partiellement un paramètre financier existant. Seuls les champs fournis seront modifiés.'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du paramètre à modifier' })
  @ApiOkResponse({
    description: 'Paramètre mis à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'ParametreUpdated' },
        message: { type: 'string', example: 'Paramètre mis à jour avec succès' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            type: { type: 'string', example: 'REGLEMENTAIRE' },
            redevanceFst: { type: 'number', example: 18000.00 },
            redevanceRegulation: { type: 'number', example: 30000.00 },
            droitEntree: { type: 'number', example: 55000.00 },
            coutsCommerciaux: { type: 'number', example: 40000.00 },
            createdAt: { type: 'string', example: '2026-01-05T12:00:00Z' },
            updatedAt: { type: 'string', example: '2026-01-05T12:30:00Z' }
          }
        }
      }
    }
  })
  @ApiBadRequestResponse({
    description: 'Données de mise à jour invalides',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 400 },
        code: { type: 'string', example: 'failure' },
        title: { type: 'string', example: 'BadRequestException' },
        message: { type: 'string', example: 'Erreur de validation des données' },
        data: {
          type: 'array',
          items: { type: 'string' },
          example: ['La redevance FST ne peut pas être négative']
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Paramètre non trouvé',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        code: { type: 'string', example: 'failure' },
        title: { type: 'string', example: 'NotFoundException' },
        message: { type: 'string', example: 'Paramètre avec l\'ID 1 non trouvé' },
        data: { type: 'array', example: [] }
      }
    }
  })
  @ApiConflictResponse({
    description: 'Conflit lors de la mise à jour',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 409 },
        code: { type: 'string', example: 'failure' },
        title: { type: 'string', example: 'ConflictException' },
        message: { type: 'string', example: 'Un paramètre de type "REGLEMENTAIRE" existe déjà' },
        data: { type: 'array', example: [] }
      }
    }
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateParametreDto: UpdateParametreDto
  ): Promise<ResponseApi<ParametreResponseDto>> {
    const parametre = await this.parametreService.update(id, updateParametreDto);
    return new ResponseApi(
      true,
      200,
      'success',
      'ParametreUpdated',
      'Paramètre mis à jour avec succès',
      parametre
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Supprimer un paramètre',
    description: 'Supprime définitivement un paramètre financier par son ID.'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du paramètre à supprimer' })
  @ApiOkResponse({
    description: 'Paramètre supprimé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        statusCode: { type: 'number', example: 200 },
        code: { type: 'string', example: 'success' },
        title: { type: 'string', example: 'ParametreDeleted' },
        message: { type: 'string', example: 'Paramètre avec l\'ID 1 supprimé avec succès' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Paramètre avec l\'ID 1 supprimé avec succès' }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({
    description: 'Paramètre non trouvé',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        statusCode: { type: 'number', example: 404 },
        code: { type: 'string', example: 'failure' },
        title: { type: 'string', example: 'NotFoundException' },
        message: { type: 'string', example: 'Paramètre avec l\'ID 1 non trouvé' },
        data: { type: 'array', example: [] }
      }
    }
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseApi<{ message: string }>> {
    const result = await this.parametreService.remove(id);
    return new ResponseApi(
      true,
      200,
      'success',
      'ParametreDeleted',
      result.message,
      result
    );
  }
}
