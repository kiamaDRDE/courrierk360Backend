// src/user/dto/activity-log-query.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ActivityLogQueryDto {
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
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un nombre entier.' })
  @Min(1, { message: 'La limite doit être supérieure ou égale à 1.' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrer par action',
    example: 'LOGIN',
  })
  @IsOptional()
  @IsString({ message: 'L\'action doit être une chaîne de caractères.' })
  action?: string;

  @ApiPropertyOptional({
    description: 'Recherche dans la description',
    example: 'connexion',
  })
  @IsOptional()
  @IsString({ message: 'La recherche doit être une chaîne de caractères.' })
  search?: string;
}
