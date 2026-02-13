import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class RelanceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Recherche globale',
    example: 'Demande',
  })
  @IsOptional()
  @IsString({ message: 'search doit être une chaîne de caractères' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Priorité du courrier',
    example: 'Haute',
  })
  @IsOptional()
  @IsString({ message: 'priorite doit être une chaîne de caractères' })
  priorite?: string;

  @ApiPropertyOptional({
    description: 'Service destinataire (idService de la transmission)',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'serviceId doit être un entier' })
  serviceId?: number;

  @ApiPropertyOptional({
    description: 'Nombre de jours de dépassement',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'retardJours doit être un entier' })
  retardJours?: number;
}
