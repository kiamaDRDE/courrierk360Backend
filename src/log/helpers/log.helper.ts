// src/log/helpers/log.helper.ts

import { Injectable } from '@nestjs/common';
import { LogService } from '../log.service';
import { LogAction, LogModule, LogLevel, LogMetadata } from '../interfaces/log.interface';

@Injectable()
export class LogHelper {
  constructor(private readonly logService: LogService) {}

  // Méthodes de convenance pour les actions courantes

  /**
   * 👤 Logger une action d'authentification
   */
  async logAuth(
    action: LogAction.LOGIN | LogAction.LOGOUT | LogAction.TOKEN_REFRESH | LogAction.OTP_VERIFICATION,
    description: string,
    options: {
      userId?: number;
      ipAddress?: string;
      metadata?: LogMetadata;
      success?: boolean;
    } = {},
  ): Promise<void> {
    const { userId, ipAddress, metadata, success = true } = options;

    await this.logService.log(action, LogModule.AUTH, description, {
      userId,
      level: success ? LogLevel.SUCCESS : LogLevel.ERROR,
      ipAddress,
      metadata,
    });
  }

  /**
   * 🔐 Logger un changement de mot de passe
   */
  async logPasswordChange(
    isAdmin: boolean,
    targetUserId: number,
    adminUserId?: number,
    ipAddress?: string,
  ): Promise<void> {
    const action = isAdmin ? LogAction.PASSWORD_CHANGE_BY_ADMIN : LogAction.PASSWORD_CHANGE;
    const description = isAdmin
      ? `Changement de mot de passe par l'admin pour l'utilisateur ID ${targetUserId}`
      : 'Changement de mot de passe personnel';

    await this.logService.log(action, LogModule.USER, description, {
      userId: isAdmin ? adminUserId : targetUserId,
      level: LogLevel.SUCCESS,
      ipAddress,
      metadata: {
        targetUserId,
        isAdminAction: isAdmin,
      },
    });
  }

  /**
   * ➕ Logger une création d'entité
   */
  async logCreate(
    module: LogModule,
    entityName: string,
    entityId: number | string,
    newValues: Record<string, any>,
    userId?: number,
    ipAddress?: string,
  ): Promise<void> {
    const actionMap: Record<LogModule, LogAction> = {
      [LogModule.OPERATEUR]: LogAction.CREATE_OPERATEUR,
      [LogModule.OFFRE]: LogAction.CREATE_OFFRE,
      [LogModule.STRUCTURE_TARIFAIRE]: LogAction.CREATE_STRUCTURE_TARIFAIRE,
      [LogModule.AVANTAGE]: LogAction.CREATE_AVANTAGE,
      [LogModule.SERVICE]: LogAction.CREATE_SERVICE,
      [LogModule.TARIF_INTERCONNEXION]: LogAction.CREATE_TARIF_INTERCONNEXION,
      [LogModule.TYPE_APPEL]: LogAction.CREATE_TYPE_APPEL,
      [LogModule.TYPE_OPERATEUR]: LogAction.CREATE_TYPE_OPERATEUR,
      [LogModule.OPTION]: LogAction.CREATE_OPTION,
      [LogModule.CONSOMMATION_MOYENNE]: LogAction.CREATE_CONSOMMATION_MOYENNE,
      [LogModule.TRAFIC]: LogAction.CREATE_TRAFIC,
      [LogModule.ABONNEMENT]: LogAction.CREATE_ABONNEMENT,
      [LogModule.CHIFFRE_AFFAIRE]: LogAction.CREATE_CHIFFRE_AFFAIRE,
      [LogModule.IHH]: LogAction.CREATE_IHH,
      [LogModule.CARACTERISTIQUE]: LogAction.CREATE_CARACTERISTIQUE,
      [LogModule.PARAMETRE]: LogAction.CREATE_PARAMETRE,
      [LogModule.AUTH]: LogAction.SYSTEM_INFO,
      [LogModule.USER]: LogAction.SYSTEM_INFO,
      [LogModule.SIGNUP]: LogAction.SIGNUP,
      [LogModule.FORGOT_PASSWORD]: LogAction.SYSTEM_INFO,
      [LogModule.SYSTEM]: LogAction.SYSTEM_INFO,
    };

    const action = actionMap[module];
    const description = `Création ${entityName} "${newValues?.nom || newValues?.name || entityId}"`;

    await this.logService.log(action, module, description, {
      userId,
      level: LogLevel.SUCCESS,
      ipAddress,
      metadata: {
        entityId,
        newValues,
        action: 'create',
      },
    });
  }

  /**
   * ✏️ Logger une mise à jour d'entité
   */
  async logUpdate(
    module: LogModule,
    entityName: string,
    entityId: number | string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    changedFields: string[],
    userId?: number,
    ipAddress?: string,
  ): Promise<void> {
    const actionMap: Record<LogModule, LogAction> = {
      [LogModule.OPERATEUR]: LogAction.UPDATE_OPERATEUR,
      [LogModule.OFFRE]: LogAction.UPDATE_OFFRE,
      [LogModule.STRUCTURE_TARIFAIRE]: LogAction.UPDATE_STRUCTURE_TARIFAIRE,
      [LogModule.AVANTAGE]: LogAction.UPDATE_AVANTAGE,
      [LogModule.SERVICE]: LogAction.UPDATE_SERVICE,
      [LogModule.TARIF_INTERCONNEXION]: LogAction.UPDATE_TARIF_INTERCONNEXION,
      [LogModule.TYPE_APPEL]: LogAction.UPDATE_TYPE_APPEL,
      [LogModule.TYPE_OPERATEUR]: LogAction.UPDATE_TYPE_OPERATEUR,
      [LogModule.OPTION]: LogAction.UPDATE_OPTION,
      [LogModule.CONSOMMATION_MOYENNE]: LogAction.UPDATE_CONSOMMATION_MOYENNE,
      [LogModule.TRAFIC]: LogAction.UPDATE_TRAFIC,
      [LogModule.ABONNEMENT]: LogAction.UPDATE_ABONNEMENT,
      [LogModule.CHIFFRE_AFFAIRE]: LogAction.UPDATE_CHIFFRE_AFFAIRE,
      [LogModule.IHH]: LogAction.UPDATE_IHH,
      [LogModule.CARACTERISTIQUE]: LogAction.UPDATE_CARACTERISTIQUE,
      [LogModule.PARAMETRE]: LogAction.UPDATE_PARAMETRE,
      [LogModule.AUTH]: LogAction.SYSTEM_INFO,
      [LogModule.USER]: LogAction.SYSTEM_INFO,
      [LogModule.SIGNUP]: LogAction.SYSTEM_INFO,
      [LogModule.FORGOT_PASSWORD]: LogAction.SYSTEM_INFO,
      [LogModule.SYSTEM]: LogAction.SYSTEM_INFO,
    };

    const action = actionMap[module];
    const description = `Modification ${entityName} "${oldValues?.nom || oldValues?.name || entityId}" - Champs modifiés: ${changedFields.join(', ')}`;

    await this.logService.log(action, module, description, {
      userId,
      level: LogLevel.SUCCESS,
      ipAddress,
      metadata: {
        entityId,
        oldValues,
        newValues,
        changedFields,
        action: 'update',
      },
    });
  }

  /**
   * 🗑️ Logger une suppression d'entité
   */
  async logDelete(
    module: LogModule,
    entityName: string,
    entityId: number | string,
    entityData: Record<string, any>,
    userId?: number,
    ipAddress?: string,
  ): Promise<void> {
    const actionMap: Record<LogModule, LogAction> = {
      [LogModule.OPERATEUR]: LogAction.DELETE_OPERATEUR,
      [LogModule.OFFRE]: LogAction.DELETE_OFFRE,
      [LogModule.STRUCTURE_TARIFAIRE]: LogAction.DELETE_STRUCTURE_TARIFAIRE,
      [LogModule.AVANTAGE]: LogAction.DELETE_AVANTAGE,
      [LogModule.SERVICE]: LogAction.DELETE_SERVICE,
      [LogModule.TARIF_INTERCONNEXION]: LogAction.DELETE_TARIF_INTERCONNEXION,
      [LogModule.TYPE_APPEL]: LogAction.DELETE_TYPE_APPEL,
      [LogModule.TYPE_OPERATEUR]: LogAction.DELETE_TYPE_OPERATEUR,
      [LogModule.OPTION]: LogAction.DELETE_OPTION,
      [LogModule.CONSOMMATION_MOYENNE]: LogAction.DELETE_CONSOMMATION_MOYENNE,
      [LogModule.TRAFIC]: LogAction.DELETE_TRAFIC,
      [LogModule.ABONNEMENT]: LogAction.DELETE_ABONNEMENT,
      [LogModule.CHIFFRE_AFFAIRE]: LogAction.DELETE_CHIFFRE_AFFAIRE,
      [LogModule.IHH]: LogAction.DELETE_IHH,
      [LogModule.CARACTERISTIQUE]: LogAction.DELETE_CARACTERISTIQUE,
      [LogModule.PARAMETRE]: LogAction.DELETE_PARAMETRE,
      [LogModule.AUTH]: LogAction.SYSTEM_INFO,
      [LogModule.USER]: LogAction.SYSTEM_INFO,
      [LogModule.SIGNUP]: LogAction.SYSTEM_INFO,
      [LogModule.FORGOT_PASSWORD]: LogAction.SYSTEM_INFO,
      [LogModule.SYSTEM]: LogAction.SYSTEM_INFO,
    };

    const action = actionMap[module];
    const description = `Suppression ${entityName} "${entityData?.nom || entityData?.name || entityId}"`;

    await this.logService.log(action, module, description, {
      userId,
      level: LogLevel.SUCCESS,
      ipAddress,
      metadata: {
        entityId,
        oldValues: entityData,
        action: 'delete',
      },
    });
  }

  /**
   * ⚠️ Logger une erreur système
   */
  async logError(
    module: LogModule,
    error: Error,
    context?: string,
    userId?: number,
    metadata?: LogMetadata,
  ): Promise<void> {
    const description = context
      ? `Erreur dans ${context}: ${error.message}`
      : `Erreur système: ${error.message}`;

    await this.logService.log(LogAction.SYSTEM_ERROR, module, description, {
      userId,
      level: LogLevel.ERROR,
      metadata: {
        ...metadata,
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
        context,
      },
    });
  }

  /**
   * 📊 Logger les actions de calcul d'effet de club
   */
  async logEffetClub(
    offreId: number,
    offreName: string,
    calculatedValue: number,
    userId?: number,
    ipAddress?: string,
  ): Promise<void> {
    const description = `Calcul effet de club pour l'offre "${offreName}" (ID: ${offreId}) - Valeur calculée: ${calculatedValue}`;

    await this.logService.log(LogAction.CALCUL_EFFET_CLUB, LogModule.OFFRE, description, {
      userId,
      level: LogLevel.SUCCESS,
      ipAddress,
      metadata: {
        entityId: offreId,
        offreName,
        calculatedValue,
        action: 'calculate_effet_club',
      },
    });
  }

  /**
   * 🔍 Logger les actions de consultation/vue
   */
  async logView(
    module: LogModule,
    entityName: string,
    entityId: number | string,
    userId?: number,
    ipAddress?: string,
  ): Promise<void> {
    const actionMap: Record<LogModule, LogAction> = {
      [LogModule.OPERATEUR]: LogAction.VIEW_OPERATEUR,
      [LogModule.OFFRE]: LogAction.VIEW_OFFRE,
      [LogModule.STRUCTURE_TARIFAIRE]: LogAction.VIEW_STRUCTURE_TARIFAIRE,
      [LogModule.AVANTAGE]: LogAction.VIEW_AVANTAGE,
      [LogModule.SERVICE]: LogAction.VIEW_SERVICE,
      [LogModule.TARIF_INTERCONNEXION]: LogAction.VIEW_TARIF_INTERCONNEXION,
      [LogModule.TYPE_APPEL]: LogAction.VIEW_TYPE_APPEL,
      [LogModule.TYPE_OPERATEUR]: LogAction.VIEW_TYPE_OPERATEUR,
      [LogModule.OPTION]: LogAction.VIEW_OPTION,
      [LogModule.CONSOMMATION_MOYENNE]: LogAction.VIEW_CONSOMMATION_MOYENNE,
      [LogModule.TRAFIC]: LogAction.VIEW_TRAFIC,
      [LogModule.ABONNEMENT]: LogAction.VIEW_ABONNEMENT,
      [LogModule.CHIFFRE_AFFAIRE]: LogAction.VIEW_CHIFFRE_AFFAIRE,
      [LogModule.IHH]: LogAction.VIEW_IHH,
      [LogModule.CARACTERISTIQUE]: LogAction.VIEW_CARACTERISTIQUE,
      [LogModule.PARAMETRE]: LogAction.VIEW_PARAMETRE,
      [LogModule.AUTH]: LogAction.SYSTEM_INFO,
      [LogModule.USER]: LogAction.SYSTEM_INFO,
      [LogModule.SIGNUP]: LogAction.SYSTEM_INFO,
      [LogModule.FORGOT_PASSWORD]: LogAction.SYSTEM_INFO,
      [LogModule.SYSTEM]: LogAction.SYSTEM_INFO,
    };

    const action = actionMap[module];
    const description = `Consultation ${entityName} (ID: ${entityId})`;

    await this.logService.log(action, module, description, {
      userId,
      level: LogLevel.INFO,
      ipAddress,
      metadata: {
        entityId,
        action: 'view',
      },
    });
  }
}
