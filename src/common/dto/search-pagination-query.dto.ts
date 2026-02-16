// src/common/dto/search-pagination-query.dto.ts

import { IsOptional, IsString, IsArray, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { PaginationQueryDto } from './pagination-query.dto';

export class SearchPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Terme de recherche pour filtrer les résultats',
    example: 'john',
  })
  @IsOptional()
  @IsString({ message: 'Le terme de recherche doit être une chaîne de caractères' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Liste des IDs de catégories pour filtrer les correspondants',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    
    if (typeof value === 'string') {
      // Si c'est une chaîne avec des virgules, on split
      if (value.includes(',')) {
        return value.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      }
      // Si c'est une chaîne simple, on convertit en nombre dans un tableau
      const parsed = parseInt(value, 10);
      return !isNaN(parsed) ? [parsed] : undefined;
    }
    
    if (Array.isArray(value)) {
      return value.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    }
    
    // Si c'est un nombre simple
    if (typeof value === 'number') {
      return [value];
    }
    
    return undefined;
  })
  @IsArray({ message: 'Les IDs de catégories doivent être un tableau' })
  @IsInt({ each: true, message: 'Chaque ID de catégorie doit être un nombre entier' })
  categoryIds?: number[];
}
