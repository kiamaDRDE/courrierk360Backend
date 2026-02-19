// src/coffre/dto/grouped-coffre-query.dto.ts

import { IsOptional, IsInt, IsBoolean, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GroupedCoffreQueryDto {
  @ApiPropertyOptional({
    description: 'Recherche globale (nom de coffre ou nom de salle)',
    example: 'Coffre A',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par ID de salle',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idSalle?: number;

  @ApiPropertyOptional({
    description: 'Filtrer par statut actif/inactif des coffres (envoyer "true" ou "false" comme chaîne)',
    example: 'true',
    type: String,
    enum: ['true', 'false'],
  })
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => {
    console.log('Transform DTO - value reçu:', value, 'type:', typeof value);
    // Convertir explicitement la chaîne en booléen
    if (value === 'true') return true;
    if (value === 'false') return false;
    // Si undefined, null ou autre, ne pas filtrer
    return undefined;
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Numéro de la page pour les salles',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Nombre de salles par page (0 = toutes)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Numéro de la page pour les coffres de chaque salle',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  coffrePage?: number;

  @ApiPropertyOptional({
    description: 'Nombre de coffres par page pour chaque salle (0 = tous)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  coffreLimit?: number;
}
