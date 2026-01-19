// src/log/decorators/auto-log.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { LogAction, LogModule, LogLevel } from '../interfaces/log.interface';

export interface AutoLogOptions {
  action: LogAction;
  module: LogModule;
  level?: LogLevel;
  description?: string;
  includeArgs?: boolean;
  includeResult?: boolean;
}

export const AUTO_LOG_KEY = 'auto_log';

/**
 * Décorateur pour activer le logging automatique sur une méthode
 * 
 * @param options Configuration du log
 * 
 * @example
 * @AutoLog({
 *   action: LogAction.CREATE_OPERATEUR,
 *   module: LogModule.OPERATEUR,
 *   level: LogLevel.SUCCESS,
 *   description: 'Création d\'un nouvel opérateur'
 * })
 * async createOperateur(data: CreateOperateurDto) {
 *   // Votre logique...
 * }
 */
export const AutoLog = (options: AutoLogOptions) => SetMetadata(AUTO_LOG_KEY, options);
