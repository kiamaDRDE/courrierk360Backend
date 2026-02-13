import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { SearchService } from '../common/search.service';
import { permissionSearchConfig } from './permission.config';

@Injectable()
export class PermissionService {
  constructor(
    private prisma: PrismaService,
    private responseFormatter: ResponseFormatterService,
    private paginationService: PaginationService,
    private searchService: SearchService,
  ) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const existingPermission = await this.prisma.permission.findFirst({
      where: {
        nom: createPermissionDto.nom,
        isDelete: false,
      },
    });

    if (existingPermission) {
      throw new ConflictException(
        `Une permission avec le nom "${createPermissionDto.nom}" existe déjà`,
      );
    }

    const permission = await this.prisma.permission.create({
      data: createPermissionDto,
    });

    return this.responseFormatter.created(
      permission,
      'Permission créée',
      'La permission a été créée avec succès',
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
      stringFields: permissionSearchConfig.stringFields,
    };

    const where = this.searchService.buildSearchWhere(search, searchConfig);

    const totalItems = await this.prisma.permission.count({ where });

    const pagination = this.paginationService.createPaginationMeta(
      page,
      limit,
      totalItems,
    );

    const permissions = await this.prisma.permission.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const paginatedResult = {
      items: permissions,
      pagination,
    };

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste des permissions',
      'Permissions récupérées avec succès',
    );
  }

  async findOne(id: number) {
    const permission = await this.prisma.permission.findFirst({
      where: {
        id,
        isDelete: false,
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission avec l'ID ${id} non trouvée`);
    }

    return this.responseFormatter.success(
      permission,
      'Permission récupérée',
      'La permission a été récupérée avec succès',
    );
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findFirst({
      where: {
        id,
        isDelete: false,
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission avec l'ID ${id} non trouvée`);
    }

    if (updatePermissionDto.nom && updatePermissionDto.nom !== permission.nom) {
      const existingPermission = await this.prisma.permission.findFirst({
        where: {
          nom: updatePermissionDto.nom,
          isDelete: false,
          id: { not: id },
        },
      });

      if (existingPermission) {
        throw new ConflictException(
          `Une permission avec le nom "${updatePermissionDto.nom}" existe déjà`,
        );
      }
    }

    const updatedPermission = await this.prisma.permission.update({
      where: { id },
      data: updatePermissionDto,
    });

    return this.responseFormatter.updated(
      updatedPermission,
      'Permission mise à jour',
      'La permission a été mise à jour avec succès',
    );
  }

  async remove(id: number) {
    const permission = await this.prisma.permission.findFirst({
      where: {
        id,
        isDelete: false,
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission avec l'ID ${id} non trouvée`);
    }

    await this.prisma.permission.update({
      where: { id },
      data: { isDelete: true },
    });

    return this.responseFormatter.deleted(
      'Permission supprimée',
      'La permission a été supprimée logiquement avec succès',
      { id },
    );
  }

  async removePermanently(id: number) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        roles: true,
      },
    });

    if (!permission) {
      throw new NotFoundException(`Permission avec l'ID ${id} non trouvée`);
    }

    if (permission.roles && permission.roles.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cette permission car elle est associée à ${permission.roles.length} rôle(s)`,
      );
    }

    await this.prisma.permission.delete({
      where: { id },
    });

    return this.responseFormatter.deleted(
      'Permission supprimée définitivement',
      'La permission a été supprimée définitivement avec succès',
      { id },
    );
  }
}
