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
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@ApiTags('Permission')
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une permission',
    description: 'Crée une nouvelle permission avec un nom unique',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission créée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'CREATED',
        title: 'Permission créée',
        message: 'La permission a été créée avec succès',
        data: {
          id: 1,
          nom: 'CREER_COURRIER',
          description: 'Permet de créer des courriers',
          isDelete: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      },
    },
  })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les permissions',
    description:
      'Récupère la liste des permissions avec pagination et recherche',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page',
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
    description: 'Terme de recherche (nom)',
    example: 'COURRIER',
  })
  @ApiQuery({
    name: 'isDelete',
    required: false,
    type: Boolean,
    description: 'Filtrer par statut de suppression (true = supprimées, false = actives, non fourni = actives uniquement)',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des permissions récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Liste des permissions',
        message: 'Permissions récupérées avec succès',
        data: {
          items: [
            {
              id: 1,
              nom: 'CREER_COURRIER',
              description: 'Permet de créer des courriers',
              isDelete: false,
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z',
            },
            {
              id: 2,
              nom: 'MODIFIER_COURRIER',
              description: 'Permet de modifier des courriers',
              isDelete: false,
              createdAt: '2024-01-15T09:20:00.000Z',
              updatedAt: '2024-01-15T09:20:00.000Z',
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
            startIndex: 1,
            endIndex: 2,
          },
        },
      },
    },
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isDelete') isDelete?: string,
  ) {
    const isDeleteBoolean = isDelete === 'true' ? true : isDelete === 'false' ? false : undefined;
    return this.permissionService.findAll(page, limit, search, isDeleteBoolean);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une permission',
    description: 'Récupère les détails d\'une permission par son ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Permission récupérée',
        message: 'La permission a été récupérée avec succès',
        data: {
          id: 1,
          nom: 'CREER_COURRIER',
          description: 'Permet de créer des courriers',
          isDelete: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Permission non trouvée',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour une permission',
    description: 'Met à jour les informations d\'une permission',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission mise à jour avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Permission mise à jour',
        message: 'La permission a été mise à jour avec succès',
        data: {
          id: 1,
          nom: 'CREER_COURRIER',
          description: 'Permet de créer tous types de courriers',
          isDelete: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T11:45:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Permission non trouvée',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer une permission (logiquement)',
    description: 'Marque une permission comme supprimée (soft delete)',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission supprimée logiquement avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Permission supprimée',
        message: 'La permission a été supprimée logiquement avec succès',
        data: {
          id: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Permission non trouvée',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.remove(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({
    summary: 'Supprimer une permission définitivement',
    description:
      'Supprime définitivement une permission de la base de données. Échoue si la permission est associée à des rôles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission supprimée définitivement avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Permission supprimée définitivement',
        message: 'La permission a été supprimée définitivement avec succès',
        data: {
          id: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Permission associée à des rôles',
  })
  @ApiResponse({
    status: 404,
    description: 'Permission non trouvée',
  })
  removePermanently(@Param('id', ParseIntPipe) id: number) {
    return this.permissionService.removePermanently(id);
  }
}
