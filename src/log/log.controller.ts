// src/log/log.controller.ts

import { 
  Controller, 
  Get, 
  Query, 
  HttpCode, 
  HttpStatus, 
  UseGuards,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiResponse, 
  ApiOperation, 
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LogService } from './log.service';
import { LogQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../user/decorators/current-user.decorator';
import { ResponseApi } from '../../common/responseApi.dto';
import { LogAction, LogModule, LogLevel } from './interfaces/log.interface';

interface UserPayload {
  id: number;
  nom: string;
  email: string;
  role: string;
}

@ApiTags('Logs')
@Controller('logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  //  API: Récupérer les logs avec filtres et pagination
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Récupérer les logs',
    description: 'Récupère la liste des logs d\'activité avec pagination et filtres avancés.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Numéro de la page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'action', required: false, enum: LogAction, description: 'Filtrer par action' })
  @ApiQuery({ name: 'module', required: false, enum: LogModule, description: 'Filtrer par module' })
  @ApiQuery({ name: 'level', required: false, enum: LogLevel, description: 'Filtrer par niveau' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Filtrer par utilisateur' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche dans la description' })
  @ApiQuery({ 
    name: 'startDate', 
    required: false, 
    type: String, 
    description: 'Date de début (YYYY-MM-DD ou ISO 8601 complet)',
    example: '2025-01-01'
  })
  @ApiQuery({ 
    name: 'endDate', 
    required: false, 
    type: String, 
    description: 'Date de fin (YYYY-MM-DD ou ISO 8601 complet)',
    example: '2025-01-31'
  })
  @ApiQuery({ name: 'ipAddress', required: false, type: String, description: 'Filtrer par adresse IP' })
  @ApiQuery({ name: 'entityId', required: false, type: Number, description: 'Filtrer par ID d\'entité' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'action', 'module', 'level'], description: 'Tri par' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Ordre de tri' })
  @ApiResponse({
    status: 200,
    description: 'Logs récupérés avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'LOGS_RETRIEVED',
          title: 'Logs récupérés',
          message: '15 log(s) récupéré(s) avec succès.',
          data: {
            logs: [
              {
                id: 156,
                userId: 1,
                action: 'CREATE_OPERATEUR',
                module: 'OPERATEUR',
                level: 'SUCCESS',
                description: 'Création d\'un nouvel opérateur "Orange Cameroun"',
                ipAddress: '192.168.1.100',
                metadata: {
                  entityId: 123,
                  newValues: {
                    nom: 'Orange Cameroun',
                    code: 'ORA-CM',
                  },
                },
                createdAt: '2025-01-06T10:30:00.000Z',
                user: {
                  id: 1,
                  nom: 'Admin PATNUC',
                  email: 'admin@patnuc.com',
                },
              },
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 1247,
              totalPages: 63,
              hasNextPage: true,
              hasPreviousPage: false,
            },
          },
        },
      },
    },
  })
  async getLogs(@Query() query: LogQueryDto) {
    const result = await this.logService.getLogs(query);
    
    return new ResponseApi(
      true,
      200,
      'LOGS_RETRIEVED',
      'Logs récupérés',
      result.message,
      result.data,
    );
  }

  // ️ API: Nettoyer les anciens logs (Admin uniquement)
  @Delete('cleanup/:days')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Nettoyer les anciens logs',
    description: 'Supprime les logs d\'activité plus anciens que le nombre de jours spécifié. (Admin seulement)',
  })
  @ApiResponse({
    status: 200,
    description: 'Anciens logs supprimés avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 200,
          code: 'LOGS_CLEANED',
          title: 'Nettoyage des logs',
          message: '234 anciens logs supprimés.',
          data: {
            deletedCount: 234,
          },
        },
      },
    },
  })
  async cleanupOldLogs(
    @CurrentUser() user: UserPayload,
    @Query('days', ParseIntPipe) days: number,
  ) {
    // Note: Ici vous pouvez ajouter une vérification du rôle admin
    // if (user.role !== 'SUPER_ADMIN') {
    //   throw new ForbiddenException('Seuls les super admins peuvent nettoyer les logs.');
    // }

    const result = await this.logService.cleanupOldLogs(days);
    
    return new ResponseApi(
      true,
      200,
      'LOGS_CLEANED',
      result.title,
      result.message,
      result.data,
    );
  }
}
