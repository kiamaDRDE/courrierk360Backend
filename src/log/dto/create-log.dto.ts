// src/log/dto/create-log.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { LogAction, LogModule, LogLevel, LogMetadata } from '../interfaces/log.interface';

export class CreateLogDto {
  @ApiPropertyOptional({
    description: 'ID de l\'utilisateur qui effectue l\'action',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID utilisateur doit être un nombre.' })
  userId?: number;

  @ApiProperty({
    description: 'Action effectuée',
    example: LogAction.CREATE_OPERATEUR,
    enum: LogAction,
  })
  @IsEnum(LogAction, { message: 'Action invalide.' })
  action: LogAction;

  @ApiProperty({
    description: 'Module concerné',
    example: LogModule.OPERATEUR,
    enum: LogModule,
  })
  @IsEnum(LogModule, { message: 'Module invalide.' })
  module: LogModule;

  @ApiProperty({
    description: 'Niveau de log',
    example: LogLevel.SUCCESS,
    enum: LogLevel,
  })
  @IsEnum(LogLevel, { message: 'Niveau de log invalide.' })
  level: LogLevel;

  @ApiProperty({
    description: 'Description détaillée de l\'action',
    example: 'Création d\'un nouvel opérateur "Orange Cameroun"',
  })
  @IsString({ message: 'La description doit être une chaîne de caractères.' })
  description: string;

  @ApiPropertyOptional({
    description: 'Adresse IP de l\'utilisateur',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString({ message: 'L\'adresse IP doit être une chaîne de caractères.' })
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Métadonnées additionnelles',
    example: {
      entityId: 123,
      oldValues: { nom: 'Ancien nom' },
      newValues: { nom: 'Nouveau nom' },
      changedFields: ['nom'],
    },
  })
  @IsOptional()
  @IsObject({ message: 'Les métadonnées doivent être un objet.' })
  metadata?: LogMetadata;
}
