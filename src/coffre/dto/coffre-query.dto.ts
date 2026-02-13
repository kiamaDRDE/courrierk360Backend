// src/coffre/dto/coffre-query.dto.ts

import { IsOptional, IsInt, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CoffreQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de la page',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page (0 pour tout récupérer)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Recherche globale (nom)',
    example: 'Coffre A',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut actif/inactif',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer les coffres supprimés logiquement',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isDelete?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer par ID de salle',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idSalle?: number;
}
