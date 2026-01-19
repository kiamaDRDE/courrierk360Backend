// src/log/dto/export-logs.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { LogAction, LogModule, LogLevel } from '../interfaces/log.interface';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
  PDF = 'pdf',
}

export class ExportLogsDto {
  @ApiPropertyOptional({
    description: 'Format d\'export',
    example: ExportFormat.CSV,
    enum: ExportFormat,
  })
  @IsOptional()
  @IsEnum(ExportFormat, { message: 'Format d\'export invalide.' })
  format?: ExportFormat = ExportFormat.CSV;

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
    description: 'Date de début (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de début doit être au format ISO 8601.' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Date de fin (ISO 8601)',
    example: '2025-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être au format ISO 8601.' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Recherche dans la description',
    example: 'opérateur créé',
  })
  @IsOptional()
  @IsString({ message: 'La recherche doit être une chaîne de caractères.' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Limite de résultats pour l\'export (max 10000)',
    example: 1000,
    maximum: 10000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un nombre entier.' })
  limit?: number = 5000;
}
