// src/service/dto/service-query.dto.ts

import { IsOptional, IsInt, Min, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceQueryDto {
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
    description: 'Recherche globale (nom, sigle)',
    example: 'Direction',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par type de service',
    example: 'ADMINISTRATIF',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut actif/inactif',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer les services supprimés logiquement',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDelete?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrer par ID du service parent',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({
    description: 'Filtrer par visibilité du service dans les transmissions',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    console.log('🔧 DEBUG Transform - Input:', value, typeof value);
    if (value === 'true' || value === true) {
      console.log('🔧 Output: true');
      return true;
    }
    if (value === 'false' || value === false) {
      console.log('🔧 Output: false');  
      return false;
    }
    console.log('🔧 Output: undefined');
    return undefined;
  })
  @IsBoolean()
  isVisible?: boolean;
}
