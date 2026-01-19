// src/signup/dto/user-query.dto.ts

import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de la page',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page (0 = tous)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrer par nom (recherche partielle)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par email (recherche partielle)',
    example: 'john@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par numéro de téléphone (recherche partielle)',
    example: '+237',
  })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par fonction',
    example: 'Développeur',
  })
  @IsOptional()
  @IsString()
  fonction?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par rôle',
    example: 'SUPER_ADMIN',
    enum: ['SUPER_ADMIN', 'ADMIN', 'USER'],
  })
  @IsOptional()
  @IsEnum(['SUPER_ADMIN', 'ADMIN', 'USER'])
  role?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    example: 'Actif',
    enum: ['Actif', 'Inactif'],
  })
  @IsOptional()
  @IsEnum(['Actif', 'Inactif'])
  statut?: string;
}
