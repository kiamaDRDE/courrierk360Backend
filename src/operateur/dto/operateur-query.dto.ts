// src/operateur/dto/operateur-query.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OperateurQueryDto {
  @ApiProperty({
    description: 'Numéro de page',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page (0 = tous les éléments)',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filtrer par nom (recherche partielle)',
    example: 'MTN',
    required: false,
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({
    description: 'Filtrer par code',
    example: 'MTN',
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'Filtrer par type',
    example: 'Mobile',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Filtrer par service (chaîne ou tableau JSON, ex: ["Mobile","Internet"])',
    example: ['Mobile', 'Internet'],
    required: false,
  })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiProperty({
    description: 'Filtrer par statut',
    example: 'Actif',
    required: false,
  })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiProperty({
    description: 'Filtrer par année de création',
    example: 1995,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1800)
  anneeCreation?: number;

  @ApiProperty({
    description: 'Filtrer par année',
    example: 2025,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  annee?: number;
}
