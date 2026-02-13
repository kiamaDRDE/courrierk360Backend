// src/notification/notification.controller.ts

import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@ApiTags('Notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // 📝 Créer une notification
  @Post()
  @ApiOperation({
    summary: 'Créer une notification',
    description: 'Crée une ou plusieurs notifications pour des utilisateurs et/ou des services.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['titre', 'type'],
      properties: {
        titre: { type: 'string', example: 'Nouveau courrier reçu' },
        message: {
          type: 'string',
          example: 'Un nouveau courrier a été enregistré pour votre service',
        },
        type: { type: 'string', example: 'courrier' },
        data: {
          type: 'object',
          example: { courrier_id: 123 },
        },
        user_ids: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
        },
        service_ids: {
          type: 'array',
          items: { type: 'number' },
          example: [5, 6],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Notifications créées avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        code: 'success',
        title: 'Création notification',
        message: 'Notifications créées avec succès.',
        data: [
          {
            id: 10,
            titre: 'Nouveau courrier reçu',
            message: 'Un nouveau courrier a été enregistré pour votre service',
            type: 'courrier',
            data: { courrier_id: 123 },
            idUser: 1,
            idService: null,
            isRead: false,
            readAt: null,
            isDelete: false,
          },
        ],
      },
    },
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  // ✏️ Mettre à jour une notification
  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une notification' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({
    status: 200,
    description: 'Notification mise à jour avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Mise à jour notification',
        message: 'Notification mise à jour avec succès.',
        data: {
          id: 10,
          titre: 'Mise à jour',
          message: 'Message mis à jour',
          type: 'courrier',
          data: { courrier_id: 123 },
          idUser: 1,
          idService: null,
          isRead: false,
          isDelete: false,
        },
      },
    },
  })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNotificationDto) {
    return this.notificationService.update(id, dto);
  }

  // 🔢 Nombre de notifications non lues
  @Get('unread/count')
  @ApiOperation({ summary: 'Nombre de notifications non lues (utilisateur connecté)' })
  @ApiResponse({
    status: 200,
    description: 'Nombre total des notifications non lues récupéré avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Notifications non lues',
        message: 'Nombre total des notifications non lues récupéré avec succès.',
        data: { count: 5 },
      },
    },
  })
  countUnread(@CurrentUser() user: any) {
    return this.notificationService.countUnread(user.id);
  }

  // ✅ Marquer toutes comme lues
  @Patch('read/all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  @ApiResponse({
    status: 200,
    description: 'Toutes les notifications ont été marquées comme lues.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Notifications lues',
        message: 'Toutes les notifications ont été marquées comme lues.',
        data: { updated: 6 },
      },
    },
  })
  markAllRead(@CurrentUser() user: any) {
    return this.notificationService.markAllRead(user.id);
  }

  // ✅ Marquer une notification comme lue
  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue.' })
  markRead(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markRead(user.id, id);
  }

  // ↩️ Marquer une notification comme non lue
  @Patch(':id/unread')
  @ApiOperation({ summary: 'Marquer une notification comme non lue' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Notification marquée comme non lue.' })
  markUnread(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.notificationService.markUnread(user.id, id);
  }

  // 📋 Lister les notifications (utilisateur + service)
  @Get()
  @ApiOperation({ summary: 'Lister les notifications de l’utilisateur et de son service' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Notifications récupérées avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Liste notifications',
        message: 'Notifications récupérées avec succès.',
        data: {
          items: [
            {
              id: 10,
              titre: 'Nouveau courrier reçu',
              message: 'Un nouveau courrier a été enregistré pour votre service',
              type: 'courrier',
              data: { courrier_id: 123 },
              idUser: 1,
              idService: null,
              isRead: false,
              readAt: null,
              isDelete: false,
            },
          ],
          pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 25,
            totalPages: 3,
            hasNextPage: true,
            hasPreviousPage: false,
            nextPage: 2,
            previousPage: null,
            startIndex: 0,
            endIndex: 9,
          },
        },
      },
    },
  })
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.findAll(user.id, page, limit);
  }

  // 🔎 Détail d’une notification
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une notification par ID' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({
    status: 200,
    description: 'Notification récupérée avec succès.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        code: 'success',
        title: 'Détail notification',
        message: 'Notification récupérée avec succès.',
        data: {
          id: 10,
          titre: 'Nouveau courrier reçu',
          message: 'Un nouveau courrier a été enregistré pour votre service',
          type: 'courrier',
          data: { courrier_id: 123 },
          idUser: 1,
          idService: null,
          isRead: false,
          readAt: null,
          isDelete: false,
        },
      },
    },
  })
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.notificationService.findOne(user.id, id);
  }

  // 🗑️ Suppression logique
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une notification (logique)' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Notification supprimée (logique) avec succès.' })
  delete(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.notificationService.delete(user.id, id);
  }

  // 🗑️ Suppression permanente
  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Supprimer une notification (permanente)' })
  @ApiParam({ name: 'id', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Notification supprimée définitivement avec succès.' })
  deletePermanent(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.notificationService.deletePermanent(user.id, id);
  }
}
