// src/log/log.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogDto } from './dto/create-log.dto';
import { LogQueryDto } from './dto/log-query.dto';
import { ExportLogsDto, ExportFormat } from './dto/export-logs.dto';
import { 
  LogEntry, 
  LogStats, 
  LogAction, 
  LogModule, 
  LogLevel,
  LogMetadata
} from './interfaces/log.interface';
import { ResponseApi } from '../../common/responseApi.dto';

@Injectable()
export class LogService {
  constructor(private readonly prisma: PrismaService) {}

  // Fonction utilitaire pour formater les réponses
  private formatResponse(data: any, title: string, message: string) {
    return {
      success: true,
      statusCode: 200,
      code: 'success',
      title,
      message,
      data,
    };
  }

  /**
   * 📅 Fonction utilitaire pour normaliser les dates
   * Convertit les formats YYYY-MM-DD en date complète avec heures
   */
  private normalizeDateRange(startDate?: string, endDate?: string): { start?: Date; end?: Date } {
    console.log('📅 normalizeDateRange appelée avec:', { startDate, endDate });
    
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      console.log('📅 Traitement startDate:', startDate);
      // Si c'est juste une date (YYYY-MM-DD), ajouter le début de journée
      if (startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log('📅 Format YYYY-MM-DD détecté pour startDate');
        start = new Date(`${startDate}T00:00:00.000Z`);
        
        // Si pas d'endDate mais startDate fournie, utiliser la même journée complète
        if (!endDate) {
          console.log('📅 Pas d\'endDate fournie, utilisation de la journée complète pour startDate');
          end = new Date(`${startDate}T23:59:59.999Z`);
          console.log('📅 endDate auto-générée:', end?.toISOString());
        }
      } else {
        console.log('📅 Format ISO détecté pour startDate');
        start = new Date(startDate);
      }
      console.log('📅 startDate convertie:', start?.toISOString());
    }

    if (endDate) {
      console.log('📅 Traitement endDate:', endDate);
      // Si c'est juste une date (YYYY-MM-DD), ajouter la fin de journée
      if (endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log('📅 Format YYYY-MM-DD détecté pour endDate');
        end = new Date(`${endDate}T23:59:59.999Z`);
      } else {
        console.log('📅 Format ISO détecté pour endDate');
        end = new Date(endDate);
      }
      console.log('📅 endDate convertie:', end?.toISOString());
    }

    console.log('📅 Résultat final normalizeDateRange:', { start: start?.toISOString(), end: end?.toISOString() });
    return { start, end };
  }

  /**
   * 📝 Créer un nouveau log
   */
  async createLog(createLogDto: CreateLogDto): Promise<LogEntry> {
    const {
      userId,
      action,
      module,
      level,
      description,
      ipAddress,
      metadata,
    } = createLogDto;

    const log = await this.prisma.activityLog.create({
      data: {
        userId,
        action: action.toString(),
        module: module.toString(),
        level: level.toString(),
        description,
        ipAddress,
        ...(metadata && { metadata }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return {
      ...log,
      metadata: log.metadata || null,
    } as LogEntry;
  }

  /**
   * 📋 Méthode simplifiée pour logger rapidement
   */
  async log(
    action: LogAction,
    module: LogModule,
    description: string,
    options: {
      userId?: number;
      level?: LogLevel;
      ipAddress?: string;
      metadata?: LogMetadata;
    } = {},
  ): Promise<void> {
    const { userId, level = LogLevel.INFO, ipAddress, metadata } = options;

    await this.createLog({
      userId,
      action,
      module,
      level,
      description,
      ipAddress,
      metadata,
    });
  }

  /**
   * 🔍 Récupérer les logs avec pagination et filtres
   */
  async getLogs(query: LogQueryDto) {
    const {
      page = 1,
      limit = 20,
      action,
      module,
      level,
      userId,
      search,
      startDate,
      endDate,
      ipAddress,
      entityId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    console.log('🔍 Paramètres reçus pour getLogs:', {
      startDate,
      endDate,
      page,
      limit,
      action,
      module,
      level
    });

    const skip = (page - 1) * limit;

    // Construction de la requête avec filtres
    const where: any = {};

    if (action) {
      where.action = action.toString();
    }

    if (module) {
      where.module = module.toString();
    }

    if (level) {
      where.level = level.toString();
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.description = {
        contains: search,
      };
    }

    // Utiliser la fonction de normalisation des dates
    if (startDate || endDate) {
      const { start, end } = this.normalizeDateRange(startDate, endDate);
      where.createdAt = {};
      
      if (start) {
        where.createdAt.gte = start;
        console.log('🔍 Filtre date début:', start.toISOString());
      }
      
      if (end) {
        where.createdAt.lte = end;
        console.log('🔍 Filtre date fin:', end.toISOString());
      }
      
      console.log('🔍 Objet where.createdAt final:', where.createdAt);
    }

    console.log('🔍 Objet where complet:', JSON.stringify(where, null, 2));

    if (ipAddress) {
      where.ipAddress = ipAddress;
    }

    if (entityId) {
      where.metadata = {
        path: ['entityId'],
        equals: entityId.toString(),
      };
    }

    // Récupérer les logs avec pagination
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    console.log(`🔍 Résultats: ${logs.length} logs trouvés sur ${total} total`);
    if (logs.length > 0) {
      console.log(`🔍 Premier log: ${logs[0].createdAt.toISOString()}`);
      console.log(`🔍 Dernier log: ${logs[logs.length - 1].createdAt.toISOString()}`);
    }

    const totalPages = Math.ceil(total / limit);

    const formattedLogs = logs.map((log) => ({
      ...log,
      metadata: log.metadata || null,
    }));

    return this.formatResponse(
      {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      'Logs récupérés',
      `${logs.length} log(s) récupéré(s) avec succès.`,
    );
  }

  /**
   * 📊 Récupérer les statistiques des logs
   */
  async getLogStats(
    startDate?: string,
    endDate?: string,
  ): Promise<ResponseApi<LogStats>> {
    const dateFilter: any = {};
    
    // Utiliser la fonction de normalisation des dates
    if (startDate || endDate) {
      const { start, end } = this.normalizeDateRange(startDate, endDate);
      dateFilter.createdAt = {};
      
      if (start) {
        dateFilter.createdAt.gte = start;
        console.log('📊 Stats date début:', start.toISOString());
      }
      
      if (end) {
        dateFilter.createdAt.lte = end;
        console.log('📊 Stats date fin:', end.toISOString());
      }
    }

    // Statistiques générales
    const [
      totalLogs,
      logsToday,
      logsByModule,
      logsByAction,
      logsByLevel,
      topUsersRaw,
      recentErrors,
    ] = await Promise.all([
      // Total des logs
      this.prisma.activityLog.count({
        where: dateFilter,
      }),

      // Logs d'aujourd'hui
      this.prisma.activityLog.count({
        where: {
          ...dateFilter,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Logs par module
      this.prisma.activityLog.groupBy({
        by: ['module'],
        _count: {
          id: true,
        },
        where: dateFilter,
      }),

      // Logs par action
      this.prisma.activityLog.groupBy({
        by: ['action'],
        _count: {
          id: true,
        },
        where: dateFilter,
        take: 10,
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      }),

      // Logs par niveau
      this.prisma.activityLog.groupBy({
        by: ['level'],
        _count: {
          id: true,
        },
        where: dateFilter,
      }),

      // Top utilisateurs
      this.prisma.activityLog.groupBy({
        by: ['userId'],
        _count: {
          id: true,
        },
        where: {
          ...dateFilter,
          userId: { not: null },
        },
        take: 5,
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      }),

      // Erreurs récentes
      this.prisma.activityLog.findMany({
        where: {
          ...dateFilter,
          level: LogLevel.ERROR,
        },
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Formater les statistiques
    const moduleStats = logsByModule.reduce((acc, item) => {
      acc[item.module] = item._count.id;
      return acc;
    }, {});

    const actionStats = logsByAction.reduce((acc, item) => {
      acc[item.action] = item._count.id;
      return acc;
    }, {});

    const levelStats = logsByLevel.reduce((acc, item) => {
      acc[item.level] = item._count.id;
      return acc;
    }, {});

    // Récupérer les noms des utilisateurs pour le top
    const userIds = topUsersRaw.map(item => item.userId).filter(id => id !== null) as number[];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });

    const topUsers = topUsersRaw.map(item => {
      const user = users.find(u => u.id === item.userId);
      return {
        userId: item.userId,
        userName: user?.username || 'Utilisateur inconnu',
        count: item._count.id,
      };
    });

    // Calculer les métriques de santé système
    const totalErrorsToday = levelStats[LogLevel.ERROR] || 0;
    const errorRate = logsToday > 0 ? (totalErrorsToday / logsToday) * 100 : 0;
    
    let systemStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorRate > 20) systemStatus = 'critical';
    else if (errorRate > 5) systemStatus = 'warning';

    const stats: LogStats = {
      totalLogs,
      logsToday,
      logsByModule: moduleStats,
      logsByAction: actionStats,
      logsByLevel: levelStats,
      topUsers,
      recentErrors: recentErrors.map(log => ({
        ...log,
        metadata: log.metadata || null,
      })),
      systemHealth: {
        errorRate,
        averageResponseTime: 0, // À implémenter avec des métriques de performance
        status: systemStatus,
      },
    };

    return this.formatResponse(
      stats,
      'Statistiques des logs',
      'Statistiques récupérées avec succès.',
    );
  }

  /**
   * 🗑️ Nettoyer les anciens logs
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<ResponseApi<any>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deletedCount = await this.prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return this.formatResponse(
      { deletedCount: deletedCount.count },
      'Nettoyage des logs',
      `${deletedCount.count} anciens logs supprimés.`,
    );
  }

  /**
   * 📤 Exporter les logs
   */
  async exportLogs(exportDto: ExportLogsDto): Promise<Buffer> {
    const {
      format = ExportFormat.CSV,
      action,
      module,
      level,
      userId,
      startDate,
      endDate,
      search,
      limit = 5000,
    } = exportDto;

    // Construction de la requête
    const where: any = {};

    if (action) where.action = action.toString();
    if (module) where.module = module.toString();
    if (level) where.level = level.toString();
    if (userId) where.userId = userId;
    if (search) where.description = { contains: search };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Récupérer les logs
    const logs = await this.prisma.activityLog.findMany({
      where,
      take: Math.min(limit, 10000), // Limite de sécurité
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    const formattedLogs = logs.map(log => ({
      ...log,
      userName: log.user?.username || 'Système',
      userEmail: log.user?.email || 'N/A',
      metadata: log.metadata || null,
    }));

    // Générer le fichier selon le format
    switch (format) {
      case ExportFormat.CSV:
        return this.generateCSV(formattedLogs);
      case ExportFormat.JSON:
        return Buffer.from(JSON.stringify(formattedLogs, null, 2));
      default:
        throw new BadRequestException('Format d\'export non supporté.');
    }
  }

  /**
   * 📝 Générer un fichier CSV
   */
  private generateCSV(logs: any[]): Buffer {
    const headers = [
      'ID',
      'Date',
      'Utilisateur',
      'Email',
      'Action',
      'Module',
      'Niveau',
      'Description',
      'Adresse IP',
      'Métadonnées',
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.createdAt.toISOString(),
        `"${log.userName || 'N/A'}"`,
        `"${log.userEmail || 'N/A'}"`,
        `"${log.action}"`,
        `"${log.module}"`,
        `"${log.level}"`,
        `"${(log.description || '').replace(/"/g, '""')}"`,
        `"${log.ipAddress || 'N/A'}"`,
        `"${log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : 'N/A'}"`,
      ].join(',')),
    ];

    return Buffer.from(csvRows.join('\n'), 'utf8');
  }
}
