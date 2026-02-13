import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { SearchService } from '../common/search.service';
import { roleSearchConfig } from './role.config';

@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private responseFormatter: ResponseFormatterService,
    private paginationService: PaginationService,
    private searchService: SearchService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findFirst({
      where: {
        nom: createRoleDto.nom,
        isDelete: false,
      },
    });

    if (existingRole) {
      throw new ConflictException(
        `Un rôle avec le nom "${createRoleDto.nom}" existe déjà`,
      );
    }

    // Vérifier que toutes les permissions existent
    if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: {
          id: { in: createRoleDto.permissions },
          isDelete: false,
        },
      });

      if (permissions.length !== createRoleDto.permissions.length) {
        throw new BadRequestException(
          'Une ou plusieurs permissions sont invalides ou supprimées',
        );
      }
    }

    // Créer le rôle avec ses permissions
    const role = await this.prisma.role.create({
      data: {
        nom: createRoleDto.nom,
        description: createRoleDto.description,
        permissions: createRoleDto.permissions
          ? {
              create: createRoleDto.permissions.map((permissionId) => ({
                permission: {
                  connect: { id: permissionId },
                },
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                nom: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // Formater la réponse pour avoir les permissions directement
    const formattedRole = {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
    };

    return this.responseFormatter.created(
      formattedRole,
      'Rôle créé',
      'Le rôle a été créé avec succès',
    );
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, isDelete?: boolean) {
    const baseFilters: any = {};
    
    // Si isDelete est fourni, l'utiliser pour filtrer, sinon afficher seulement les non supprimés
    if (isDelete !== undefined) {
      baseFilters.isDelete = isDelete;
    } else {
      baseFilters.isDelete = false;
    }

    const searchConfig: any = {
      baseFilters,
      stringFields: roleSearchConfig.stringFields,
    };

    const where = this.searchService.buildSearchWhere(search, searchConfig);

    const totalItems = await this.prisma.role.count({ where });

    const pagination = this.paginationService.createPaginationMeta(
      page,
      limit,
      totalItems,
    );

    const roles = await this.prisma.role.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                nom: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // Formater les rôles pour avoir les permissions directement
    const formattedRoles = roles.map((role) => ({
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
    }));

    const paginatedResult = {
      items: formattedRoles,
      pagination,
    };

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des rôles',
      'Rôles récupérés avec succès',
    );
  }

  async findOne(id: number) {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        isDelete: false,
      },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                nom: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID ${id} non trouvé`);
    }

    // Formater la réponse pour avoir les permissions directement
    const formattedRole = {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
    };

    return this.responseFormatter.success(
      formattedRole,
      'Rôle récupéré',
      'Le rôle a été récupéré avec succès',
    );
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        isDelete: false,
      },
    });

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID ${id} non trouvé`);
    }

    if (updateRoleDto.nom && updateRoleDto.nom !== role.nom) {
      const existingRole = await this.prisma.role.findFirst({
        where: {
          nom: updateRoleDto.nom,
          isDelete: false,
          id: { not: id },
        },
      });

      if (existingRole) {
        throw new ConflictException(
          `Un rôle avec le nom "${updateRoleDto.nom}" existe déjà`,
        );
      }
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                nom: true,
                description: true,
              },
            },
          },
        },
      },
    });

    // Formater la réponse pour avoir les permissions directement
    const formattedRole = {
      ...updatedRole,
      permissions: updatedRole.permissions.map((rp) => rp.permission),
    };

    return this.responseFormatter.updated(
      formattedRole,
      'Rôle mis à jour',
      'Le rôle a été mis à jour avec succès',
    );
  }

  async remove(id: number) {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        isDelete: false,
      },
    });

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID ${id} non trouvé`);
    }

    await this.prisma.role.update({
      where: { id },
      data: { isDelete: true },
    });

    return this.responseFormatter.deleted(
      'Rôle supprimé',
      'Le rôle a été supprimé logiquement avec succès',
      { id },
    );
  }

  async removePermanently(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID ${id} non trouvé`);
    }

    // Supprimer d'abord les relations RolePermission (cascade automatique configurée)
    await this.prisma.role.delete({
      where: { id },
    });

    return this.responseFormatter.deleted(
      'Rôle supprimé définitivement',
      'Le rôle a été supprimé définitivement avec succès',
      { id },
    );
  }

  async assignPermissions(id: number, assignPermissionsDto: AssignPermissionsDto) {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        isDelete: false,
      },
    });

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID ${id} non trouvé`);
    }

    // Vérifier que toutes les permissions existent
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: { in: assignPermissionsDto.permissions },
        isDelete: false,
      },
    });

    if (permissions.length !== assignPermissionsDto.permissions.length) {
      throw new BadRequestException(
        'Une ou plusieurs permissions sont invalides ou supprimées',
      );
    }

    // Supprimer les anciennes permissions et créer les nouvelles
    await this.prisma.$transaction([
      // Supprimer toutes les permissions existantes du rôle
      this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      }),
      // Créer les nouvelles associations
      this.prisma.rolePermission.createMany({
        data: assignPermissionsDto.permissions.map((permissionId) => ({
          roleId: id,
          permissionId: permissionId,
        })),
      }),
    ]);

    // Récupérer le rôle mis à jour avec ses permissions
    const updatedRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                id: true,
                nom: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!updatedRole) {
      throw new NotFoundException(`Rôle avec l'ID ${id} non trouvé`);
    }

    // Formater la réponse pour avoir les permissions directement
    const formattedRole = {
      ...updatedRole,
      permissions: updatedRole.permissions.map((rp) => rp.permission),
    };

    return this.responseFormatter.updated(
      formattedRole,
      'Permissions assignées',
      'Les permissions ont été assignées au rôle avec succès',
    );
  }
}
