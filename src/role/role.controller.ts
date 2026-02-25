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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Role')
@Controller('role')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('sync-external')
  @ApiOperation({ summary: 'Synchroniser les rôles depuis une API externe' })
  @ApiResponse({ status: 200, description: 'Rôles synchronisés avec succès' })
  async syncExternal(@Body('url') url?: string) {
    return this.roleService.syncFromExternal(url);
  }

  @Post()
  @ApiOperation({
    summary: 'Créer un rôle avec permissions',
    description: 'Crée un nouveau rôle avec un nom unique et lui attribue optionnellement des permissions',
  })
  @ApiResponse({
    status: 200,
    description: 'Rôle créé avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'CREATED',
        title: 'Rôle créé',
        message: 'Le rôle a été créé avec succès',
        data: {
          id: 1,
          nom: 'Gestionnaire',
          description: 'Peut gérer les courriers',
          isDelete: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          permissions: [
            {
              id: 1,
              nom: 'CREER_COURRIER',
              description: 'Permet de créer des courriers',
            },
            {
              id: 2,
              nom: 'MODIFIER_COURRIER',
              description: 'Permet de modifier des courriers',
            },
          ],
        },
      },
    },
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les rôles',
    description:
      'Récupère la liste des rôles avec leurs permissions, pagination, recherche et filtre de suppression',
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
    example: 'Gestionnaire',
  })
  @ApiQuery({
    name: 'isDelete',
    required: false,
    type: Boolean,
    description: 'Filtrer par statut de suppression (true = supprimés, false = actifs, non fourni = actifs uniquement)',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des rôles récupérée avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Liste des rôles',
        message: 'Rôles récupérés avec succès',
        data: {
          items: [
            {
              id: 1,
              nom: 'Gestionnaire',
              description: 'Peut gérer les courriers',
              isDelete: false,
              createdAt: '2024-01-15T10:30:00.000Z',
              updatedAt: '2024-01-15T10:30:00.000Z',
              permissions: [
                {
                  id: 1,
                  nom: 'CREER_COURRIER',
                  description: 'Permet de créer des courriers',
                },
                {
                  id: 2,
                  nom: 'MODIFIER_COURRIER',
                  description: 'Permet de modifier des courriers',
                },
              ],
            },
          ],
          pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            nextPage: null,
            previousPage: null,
            startIndex: 1,
            endIndex: 1,
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
    return this.roleService.findAll(page, limit, search, isDeleteBoolean);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un rôle',
    description: 'Récupère les détails d\'un rôle avec ses permissions par son ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Rôle récupéré avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Rôle récupéré',
        message: 'Le rôle a été récupéré avec succès',
        data: {
          id: 1,
          nom: 'Gestionnaire',
          description: 'Peut gérer les courriers',
          isDelete: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          permissions: [
            {
              id: 1,
              nom: 'CREER_COURRIER',
              description: 'Permet de créer des courriers',
            },
            {
              id: 2,
              nom: 'MODIFIER_COURRIER',
              description: 'Permet de modifier des courriers',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Rôle non trouvé',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un rôle',
    description: 'Met à jour le nom et/ou la description d\'un rôle (ne modifie pas les permissions)',
  })
  @ApiResponse({
    status: 200,
    description: 'Rôle mis à jour avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Rôle mis à jour',
        message: 'Le rôle a été mis à jour avec succès',
        data: {
          id: 1,
          nom: 'Gestionnaire Principal',
          description: 'Peut gérer tous les courriers',
          isDelete: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T11:45:00.000Z',
          permissions: [
            {
              id: 1,
              nom: 'CREER_COURRIER',
              description: 'Permet de créer des courriers',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Rôle non trouvé',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Patch(':id/permissions')
  @ApiOperation({
    summary: 'Assigner des permissions à un rôle',
    description: 'Remplace toutes les permissions actuelles du rôle par les nouvelles permissions fournies',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions assignées avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Permissions assignées',
        message: 'Les permissions ont été assignées au rôle avec succès',
        data: {
          id: 1,
          nom: 'Gestionnaire',
          description: 'Peut gérer les courriers',
          isDelete: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          permissions: [
            {
              id: 1,
              nom: 'CREER_COURRIER',
              description: 'Permet de créer des courriers',
            },
            {
              id: 2,
              nom: 'MODIFIER_COURRIER',
              description: 'Permet de modifier des courriers',
            },
            {
              id: 5,
              nom: 'SUPPRIMER_COURRIER',
              description: 'Permet de supprimer des courriers',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Rôle non trouvé',
  })
  @ApiResponse({
    status: 400,
    description: 'Une ou plusieurs permissions sont invalides',
  })
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.roleService.assignPermissions(id, assignPermissionsDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Supprimer un rôle (logiquement)',
    description: 'Marque un rôle comme supprimé (soft delete)',
  })
  @ApiResponse({
    status: 200,
    description: 'Rôle supprimé logiquement avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Rôle supprimé',
        message: 'Le rôle a été supprimé logiquement avec succès',
        data: {
          id: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Rôle non trouvé',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.remove(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({
    summary: 'Supprimer un rôle définitivement',
    description:
      'Supprime définitivement un rôle de la base de données. Supprime également toutes les associations de permissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Rôle supprimé définitivement avec succès',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'SUCCESS',
        title: 'Rôle supprimé définitivement',
        message: 'Le rôle a été supprimé définitivement avec succès',
        data: {
          id: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Rôle non trouvé',
  })
  removePermanently(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.removePermanently(id);
  }
}
