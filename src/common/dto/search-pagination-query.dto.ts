// src/common/dto/search-pagination-query.dto.ts

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from './pagination-query.dto';

export class SearchPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Terme de recherche pour filtrer les résultats',
    example: 'john',
  })
  @IsOptional()
  @IsString({ message: 'Le terme de recherche doit être une chaîne de caractères' })
  search?: string;
}
