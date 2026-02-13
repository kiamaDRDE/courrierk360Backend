// src/notification/notification.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseFormatterService } from '../common/response-formatter.service';
import { PaginationService } from '../common/pagination.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseFormatter: ResponseFormatterService,
    private readonly paginationService: PaginationService,
  ) {}

  private parseDataPayload(input: any) {
    if (input === undefined) return undefined;
    if (input === null) return null;
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed) return null;
      try {
        return JSON.parse(trimmed);
      } catch {
        return input;
      }
    }
    return input;
  }

  async create(dto: CreateNotificationDto) {
    const userIds = (dto.user_ids || []).filter((v) => Number.isInteger(v) && v > 0);
    const serviceIds = (dto.service_ids || []).filter((v) => Number.isInteger(v) && v > 0);

    if (userIds.length === 0 && serviceIds.length === 0) {
      throw new BadRequestException('Veuillez fournir au moins un user_id ou un service_id.');
    }

    const dataPayload = this.parseDataPayload(dto.data) ?? null;

    const created = await this.prismaService.$transaction(async (prisma) => {
      const results: any[] = [];

      for (const userId of userIds) {
        const item = await prisma.notification.create({
          data: {
            titre: dto.titre,
            message: dto.message || null,
            type: dto.type,
            data: dataPayload,
            idUser: userId,
            idService: null,
          },
        });
        results.push(item);
      }

      for (const serviceId of serviceIds) {
        const item = await prisma.notification.create({
          data: {
            titre: dto.titre,
            message: dto.message || null,
            type: dto.type,
            data: dataPayload,
            idUser: null,
            idService: serviceId,
          },
        });
        results.push(item);
      }

      return results;
    });

    return this.responseFormatter.success(
      created,
      'Création notification',
      'Notifications créées avec succès.',
    );
  }

  async update(id: number, dto: UpdateNotificationDto) {
    const notification = await this.prismaService.notification.findUnique({ where: { id } });
    if (!notification || notification.isDelete === true) {
      throw new NotFoundException(`Notification avec l'ID ${id} introuvable.`);
    }

    const dataPayload = this.parseDataPayload(dto.data);

    const updated = await this.prismaService.notification.update({
      where: { id },
      data: {
        titre: dto.titre ?? undefined,
        message: dto.message ?? undefined,
        type: dto.type ?? undefined,
        data: dataPayload,
      },
    });

    return this.responseFormatter.success(
      updated,
      'Mise à jour notification',
      'Notification mise à jour avec succès.',
    );
  }

  async countUnread(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} introuvable.`);
    }

    const orFilters: any[] = [{ idUser: userId }];
    if (user.idService) {
      orFilters.push({ idService: user.idService });
    }

    const count = await this.prismaService.notification.count({
      where: {
        isRead: false,
        isDelete: false,
        OR: orFilters,
      },
    });

    return this.responseFormatter.success(
      { count },
      'Notifications non lues',
      'Nombre total des notifications non lues récupéré avec succès.',
    );
  }

  async markAllRead(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} introuvable.`);
    }

    const orFilters: any[] = [{ idUser: userId }];
    if (user.idService) {
      orFilters.push({ idService: user.idService });
    }

    const result = await this.prismaService.notification.updateMany({
      where: {
        isDelete: false,
        OR: orFilters,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return this.responseFormatter.success(
      { updated: result.count },
      'Notifications lues',
      'Toutes les notifications ont été marquées comme lues.',
    );
  }

  async markRead(userId: number, id: number) {
    const notification = await this.getForUser(userId, id);

    const updated = await this.prismaService.notification.update({
      where: { id: notification.id },
      data: { isRead: true, readAt: new Date() },
    });

    return this.responseFormatter.success(
      updated,
      'Notification lue',
      'Notification marquée comme lue.',
    );
  }

  async markUnread(userId: number, id: number) {
    const notification = await this.getForUser(userId, id);

    const updated = await this.prismaService.notification.update({
      where: { id: notification.id },
      data: { isRead: false, readAt: null },
    });

    return this.responseFormatter.success(
      updated,
      'Notification non lue',
      'Notification marquée comme non lue.',
    );
  }

  async delete(userId: number, id: number) {
    const notification = await this.getForUser(userId, id, true);

    const updated = await this.prismaService.notification.update({
      where: { id: notification.id },
      data: {
        isDelete: true,
        idUser: null,
        idService: null,
      },
    });

    return this.responseFormatter.success(
      updated,
      'Suppression notification',
      'Notification supprimée (logique) avec succès.',
    );
  }

  async deletePermanent(userId: number, id: number) {
    const notification = await this.getForUser(userId, id, true);

    await this.prismaService.notification.update({
      where: { id: notification.id },
      data: { idUser: null, idService: null },
    });

    await this.prismaService.notification.delete({ where: { id: notification.id } });

    return this.responseFormatter.success(
      [],
      'Suppression notification',
      'Notification supprimée définitivement avec succès.',
    );
  }

  async findAll(userId: number, page?: number, limit?: number) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} introuvable.`);
    }

    const { page: currentPage, limit: currentLimit } =
      this.paginationService.validatePaginationParams(page, limit);
    const skip = this.paginationService.getSkip(currentPage, currentLimit);

    const orFilters: any[] = [{ idUser: userId }];
    if (user.idService) {
      orFilters.push({ idService: user.idService });
    }

    const whereClause = {
      isDelete: false,
      OR: orFilters,
    } as const;

    const [notifications, total] = await Promise.all([
      this.prismaService.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: currentLimit,
      }),
      this.prismaService.notification.count({ where: whereClause }),
    ]);

    const paginatedResult = this.paginationService.createPaginatedResult(
      notifications,
      currentPage,
      currentLimit,
      total,
    );

    return this.responseFormatter.paginated(
      paginatedResult,
      'Liste notifications',
      'Notifications récupérées avec succès.',
    );
  }

  async findOne(userId: number, id: number) {
    const notification = await this.getForUser(userId, id);

    return this.responseFormatter.success(
      notification,
      'Détail notification',
      'Notification récupérée avec succès.',
    );
  }

  private async getForUser(userId: number, id: number, includeDeleted = false) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { idService: true },
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${userId} introuvable.`);
    }

    const orFilters: any[] = [{ idUser: userId }];
    if (user.idService) {
      orFilters.push({ idService: user.idService });
    }

    const notification = await this.prismaService.notification.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { isDelete: false }),
        OR: orFilters,
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification avec l'ID ${id} introuvable.`);
    }

    return notification;
  }
}
