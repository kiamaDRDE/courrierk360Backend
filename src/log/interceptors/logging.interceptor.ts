// src/log/interceptors/logging.interceptor.ts

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LogService } from '../log.service';
import { LogAction, LogModule, LogLevel, LogMetadata } from '../interfaces/log.interface';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logService: LogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { method, url, headers } = request;
    const ip = request.ip || '0.0.0.0';
    const userAgent = headers['user-agent'] || '';
    const referer = headers['referer'] || '';

    // Extraire l'utilisateur du JWT si disponible
    const user = (request as any).user;
    const userId = user?.id;

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Ne pas logger les endpoints de logs eux-mêmes pour éviter la récursion
        if (!url.includes('/logs')) {
          this.logHttpRequest({
            userId,
            method,
            url,
            statusCode,
            duration,
            ip,
            userAgent,
            referer,
            level: this.getLogLevel(statusCode),
            isSuccess: true,
            requestSize: this.getRequestSize(request),
            responseSize: this.getResponseSize(data),
          });
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;

        // Logger les erreurs
        if (!url.includes('/logs')) {
          this.logHttpRequest({
            userId,
            method,
            url,
            statusCode,
            duration,
            ip,
            userAgent,
            referer,
            level: LogLevel.ERROR,
            isSuccess: false,
            error: error.message,
            errorCode: error.code,
            requestSize: this.getRequestSize(request),
          });
        }

        return throwError(() => error);
      }),
    );
  }

  private async logHttpRequest(params: {
    userId?: number;
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    ip: string;
    userAgent: string;
    referer: string;
    level: LogLevel;
    isSuccess: boolean;
    error?: string;
    errorCode?: string;
    requestSize?: number;
    responseSize?: number;
  }) {
    const {
      userId,
      method,
      url,
      statusCode,
      duration,
      ip,
      userAgent,
      referer,
      level,
      isSuccess,
      error,
      errorCode,
      requestSize,
      responseSize,
    } = params;

    try {
      const action = this.mapUrlToAction(method, url);
      const module = this.mapUrlToModule(url);
      
      // Générer un message d'action clair pour les développeurs frontend
      const actionDescription = this.generateActionDescription(method, url, statusCode, isSuccess);

      const description = isSuccess
        ? `${actionDescription} - Réussie (${duration}ms)`
        : `${actionDescription} - Erreur ${statusCode}: ${error} (${duration}ms)`;

      const metadata: LogMetadata = {
        method,
        url,
        statusCode,
        duration,
        userAgent,
        referer,
        requestSize,
        responseSize,
      };

      if (error) {
        metadata.errorMessage = error;
        metadata.errorCode = errorCode;
      }

      await this.logService.createLog({
        userId,
        action,
        module,
        level,
        description,
        ipAddress: ip,
        metadata,
      });
    } catch (logError) {
      // Éviter les boucles d'erreur en cas de problème de logging
      console.error('Erreur lors du logging:', logError);
    }
  }

  private mapUrlToAction(method: string, url: string): LogAction {
    // Normaliser l'URL (supprimer les paramètres et IDs)
    const normalizedUrl = url.split('?')[0].replace(/\/\d+/g, '/:id');

    // Mapping des routes vers les actions
    const routeMap: Record<string, Record<string, LogAction>> = {
      '/auth/login': { POST: LogAction.LOGIN },
      '/auth/logout': { POST: LogAction.LOGOUT },
      '/auth/refresh': { POST: LogAction.TOKEN_REFRESH },
      '/auth/verify-otp': { POST: LogAction.OTP_VERIFICATION },
      
      '/signup': { 
        POST: LogAction.SIGNUP,
        GET: LogAction.LIST_OPERATEURS, // Assuming signup list
      },
      
      '/forgot-password/request': { POST: LogAction.PASSWORD_RESET_REQUEST },
      '/forgot-password/reset': { POST: LogAction.PASSWORD_RESET_COMPLETE },
      
      '/user/password': { PATCH: LogAction.PASSWORD_CHANGE },
      '/user/:id/password': { PATCH: LogAction.PASSWORD_CHANGE_BY_ADMIN },
      
      '/operateur': {
        POST: LogAction.CREATE_OPERATEUR,
        GET: LogAction.LIST_OPERATEURS,
      },
      '/operateur/:id': {
        GET: LogAction.VIEW_OPERATEUR,
        PATCH: LogAction.UPDATE_OPERATEUR,
        DELETE: LogAction.DELETE_OPERATEUR,
      },
      
      '/offre': {
        POST: LogAction.CREATE_OFFRE,
        GET: LogAction.LIST_OFFRES,
      },
      '/offre/:id': {
        GET: LogAction.VIEW_OFFRE,
        PATCH: LogAction.UPDATE_OFFRE,
        DELETE: LogAction.DELETE_OFFRE,
      },
      '/offre/:id/calculer-effet-club': { POST: LogAction.CALCUL_EFFET_CLUB },
      '/offre/:id/effet-club': { GET: LogAction.VIEW_EFFET_CLUB },
      '/offre/effets-club/all': { GET: LogAction.VIEW_EFFET_CLUB },
      
      '/structure-tarifaire': {
        POST: LogAction.CREATE_STRUCTURE_TARIFAIRE,
        GET: LogAction.LIST_STRUCTURES_TARIFAIRES,
        PATCH: LogAction.UPDATE_MULTIPLE_STRUCTURES_TARIFAIRES,
      },
      '/structure-tarifaire/:id': {
        GET: LogAction.VIEW_STRUCTURE_TARIFAIRE,
        PATCH: LogAction.UPDATE_STRUCTURE_TARIFAIRE,
        DELETE: LogAction.DELETE_STRUCTURE_TARIFAIRE,
      },
      
      '/avantages': {
        POST: LogAction.CREATE_AVANTAGE,
        GET: LogAction.LIST_AVANTAGES,
        PATCH: LogAction.UPDATE_MULTIPLE_AVANTAGES,
      },
      '/avantages/:id': {
        GET: LogAction.VIEW_AVANTAGE,
        PATCH: LogAction.UPDATE_AVANTAGE,
        DELETE: LogAction.DELETE_AVANTAGE,
      },
    };

    return routeMap[normalizedUrl]?.[method] || LogAction.SYSTEM_INFO;
  }

  private mapUrlToModule(url: string): LogModule {
    if (url.includes('/auth')) return LogModule.AUTH;
    if (url.includes('/signup')) return LogModule.SIGNUP;
    if (url.includes('/forgot-password')) return LogModule.FORGOT_PASSWORD;
    if (url.includes('/user')) return LogModule.USER;
    if (url.includes('/operateur')) return LogModule.OPERATEUR;
    if (url.includes('/offre')) return LogModule.OFFRE;
    if (url.includes('/structure-tarifaire')) return LogModule.STRUCTURE_TARIFAIRE;
    if (url.includes('/avantage')) return LogModule.AVANTAGE;
    if (url.includes('/service')) return LogModule.SERVICE;
    if (url.includes('/tarif-interconnexion')) return LogModule.TARIF_INTERCONNEXION;
    if (url.includes('/type-appel')) return LogModule.TYPE_APPEL;
    if (url.includes('/type-operateur')) return LogModule.TYPE_OPERATEUR;
    if (url.includes('/option')) return LogModule.OPTION;
    if (url.includes('/consommation')) return LogModule.CONSOMMATION_MOYENNE;
    if (url.includes('/trafic')) return LogModule.TRAFIC;
    if (url.includes('/abonnement')) return LogModule.ABONNEMENT;
    if (url.includes('/chiffre-affaire')) return LogModule.CHIFFRE_AFFAIRE;
    if (url.includes('/ihh')) return LogModule.IHH;
    if (url.includes('/caracteristique')) return LogModule.CARACTERISTIQUE;
    if (url.includes('/parametre')) return LogModule.PARAMETRE;
    
    return LogModule.SYSTEM;
  }

  private getLogLevel(statusCode: number): LogLevel {
    if (statusCode >= 500) return LogLevel.ERROR;
    if (statusCode >= 400) return LogLevel.WARNING;
    if (statusCode >= 200 && statusCode < 300) return LogLevel.SUCCESS;
    return LogLevel.INFO;
  }

  private getRequestSize(request: Request): number {
    try {
      return JSON.stringify(request.body || {}).length;
    } catch {
      return 0;
    }
  }

  private getResponseSize(data: any): number {
    try {
      return JSON.stringify(data || {}).length;
    } catch {
      return 0;
    }
  }

  /**
   * Génère une description d'action claire pour les développeurs frontend
   * Basée sur la méthode HTTP et l'URL
   */
  private generateActionDescription(method: string, url: string, statusCode: number, isSuccess: boolean): string {
    // Normaliser l'URL pour extraire l'entité/ressource
    const urlParts = url.split('?')[0].split('/').filter(part => part.length > 0);
    
    // Identifier l'entité principale (premier segment après l'API)
    const entity = urlParts[0] || 'ressource';
    const hasId = urlParts.length > 1 && /^\d+$/.test(urlParts[1]);
    const subAction = urlParts.length > 2 ? urlParts[2] : null;

    // Mapping des entités vers des noms plus lisibles
    const entityNames: Record<string, string> = {
      'auth': 'authentification',
      'signup': 'inscription',
      'user': 'utilisateur',
      'operateur': 'opérateur',
      'offre': 'offre',
      'structure-tarifaire': 'structure tarifaire',
      'avantage': 'avantage',
      'service': 'service',
      'tarif-interconnexion': 'tarif d\'interconnexion',
      'type-appel': 'type d\'appel',
      'type-operateur': 'type d\'opérateur',
      'option': 'option',
      'consommation-moyenne': 'consommation moyenne',
      'trafic': 'trafic',
      'abonnement': 'abonnement',
      'chiffre-affaire': 'chiffre d\'affaires',
      'ihh': 'IHH',
      'caracteristique': 'caractéristique',
      'parametre': 'paramètre',
      'forgot-password': 'mot de passe oublié',
    };

    const readableEntity = entityNames[entity] || entity;

    // Générer le message selon la méthode HTTP et l'URL
    switch (method.toUpperCase()) {
      case 'GET':
        if (hasId) {
          if (subAction) {
            // GET /entity/123/subaction
            return `Récupération ${subAction} de ${readableEntity}`;
          } else {
            // GET /entity/123
            return `Consultation de ${readableEntity}`;
          }
        } else {
          if (subAction === 'stats') {
            return `Consultation des statistiques de ${readableEntity}`;
          } else if (subAction === 'export') {
            return `Export des données de ${readableEntity}`;
          } else {
            // GET /entity
            return `Liste des ${readableEntity}s`;
          }
        }

      case 'POST':
        if (hasId && subAction) {
          // POST /entity/123/subaction
          switch (subAction) {
            case 'calculer-effet-club':
              return `Calcul de l'effet club pour ${readableEntity}`;
            case 'reset-password':
              return `Réinitialisation du mot de passe de ${readableEntity}`;
            case 'activate':
              return `Activation de ${readableEntity}`;
            case 'deactivate':
              return `Désactivation de ${readableEntity}`;
            default:
              return `Action ${subAction} sur ${readableEntity}`;
          }
        } else {
          // POST /entity
          switch (entity) {
            case 'auth':
              if (url.includes('login')) return 'Connexion utilisateur';
              if (url.includes('logout')) return 'Déconnexion utilisateur';
              if (url.includes('refresh')) return 'Renouvellement du token';
              if (url.includes('verify-otp')) return 'Vérification OTP';
              return 'Authentification';
            case 'signup':
              return 'Inscription d\'un nouvel utilisateur';
            case 'forgot-password':
              if (url.includes('request')) return 'Demande de réinitialisation de mot de passe';
              if (url.includes('reset')) return 'Réinitialisation de mot de passe';
              return 'Gestion mot de passe oublié';
            default:
              return `Création de ${readableEntity}`;
          }
        }

      case 'PATCH':
      case 'PUT':
        if (hasId) {
          // PATCH /entity/123
          if (url.includes('password')) {
            return `Modification du mot de passe de ${readableEntity}`;
          }
          return `Modification de ${readableEntity}`;
        } else {
          // PATCH /entity (batch update)
          return `Modification multiple de ${readableEntity}s`;
        }

      case 'DELETE':
        if (hasId) {
          // DELETE /entity/123
          return `Suppression de ${readableEntity}`;
        } else {
          if (subAction === 'cleanup') {
            return `Nettoyage des anciens ${readableEntity}s`;
          }
          // DELETE /entity (batch delete)
          return `Suppression multiple de ${readableEntity}s`;
        }

      default:
        return `Opération ${method} sur ${readableEntity}`;
    }
  }
}
