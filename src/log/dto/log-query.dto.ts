// src/log/dto/log-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { LogAction, LogModule, LogLevel } from '../interfaces/log.interface';

export class LogQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de la page',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La page doit être un nombre entier.' })
  @Min(1, { message: 'La page doit être supérieure ou égale à 1.' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 20,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un nombre entier.' })
  @Min(1, { message: 'La limite doit être supérieure ou égale à 1.' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filtrer par action',
    example: LogAction.LOGIN,
    enum: LogAction,
  })
  @IsOptional()
  @IsEnum(LogAction, { message: 'Action invalide.' })
  action?: LogAction;

  @ApiPropertyOptional({
    description: 'Filtrer par module',
    example: LogModule.AUTH,
    enum: LogModule,
  })
  @IsOptional()
  @IsEnum(LogModule, { message: 'Module invalide.' })
  module?: LogModule;

  @ApiPropertyOptional({
    description: 'Filtrer par niveau de log',
    example: LogLevel.ERROR,
    enum: LogLevel,
  })
  @IsOptional()
  @IsEnum(LogLevel, { message: 'Niveau de log invalide.' })
  level?: LogLevel;

  @ApiPropertyOptional({
    description: 'Filtrer par ID utilisateur',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L\'ID utilisateur doit être un nombre entier.' })
  userId?: number;

  @ApiPropertyOptional({
    description: 'Recherche dans la description',
    example: 'opérateur créé',
  })
  @IsOptional()
  @IsString({ message: 'La recherche doit être une chaîne de caractères.' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Date de début (accepte YYYY-MM-DD ou ISO 8601 complet)',
    example: '2025-01-01',
    examples: {
      simple: {
        summary: 'Format simple',
        value: '2025-01-01'
      },
      iso: {
        summary: 'Format ISO complet',
        value: '2025-01-01T00:00:00.000Z'
      }
    }
  })
  @IsOptional()
  @IsString({ message: 'La date de début doit être une chaîne de caractères valide.' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Date de fin (accepte YYYY-MM-DD ou ISO 8601 complet)',
    example: '2025-01-31',
    examples: {
      simple: {
        summary: 'Format simple',
        value: '2025-01-31'
      },
      iso: {
        summary: 'Format ISO complet',
        value: '2025-01-31T23:59:59.999Z'
      }
    }
  })
  @IsOptional()
  @IsString({ message: 'La date de fin doit être une chaîne de caractères valide.' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Adresse IP',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString({ message: 'L\'adresse IP doit être une chaîne de caractères.' })
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'ID d\'entité dans les métadonnées',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'L\'ID d\'entité doit être un nombre entier.' })
  entityId?: number;

  @ApiPropertyOptional({
    description: 'Tri par (createdAt, action, module, level)',
    example: 'createdAt',
    enum: ['createdAt', 'action', 'module', 'level'],
  })
  @IsOptional()
  @IsString({ message: 'Le champ de tri doit être une chaîne de caractères.' })
  sortBy?: 'createdAt' | 'action' | 'module' | 'level' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'L\'ordre de tri doit être "asc" ou "desc".' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
