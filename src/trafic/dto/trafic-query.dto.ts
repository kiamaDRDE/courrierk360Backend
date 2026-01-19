import { IsOptional, IsNumber, IsString, Min, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TraficQueryDto {
  @ApiPropertyOptional({ 
    description: 'Numéro de la page (0 pour récupérer tous les résultats)',
    example: 1,
    minimum: 0,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Nombre d\'éléments par page',
    example: 10,
    minimum: 1,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Filtrer par ID d\'opérateur',
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  operateurId?: number;

  @ApiPropertyOptional({ 
    description: 'Filtrer par année',
    example: 2024
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  annee?: number;

  @ApiPropertyOptional({ 
    description: 'Filtrer par type de trafic',
    example: 'ENTRANT'
  })
  @IsOptional()
  @IsString()
  typeTrafic?: string;

  @ApiPropertyOptional({ 
    description: 'Recherche par nom d\'opérateur',
    example: 'Orange'
  })
  @IsOptional()
  @IsString()
  operateurNom?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrer par ID de service',
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  serviceId?: number;

  @ApiPropertyOptional({ 
    description: 'Filtrer par ID d\'autre opérateur',
    example: 2
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  autreOperateurId?: number;

  @ApiPropertyOptional({ 
    description: 'Tri par champ',
    example: 'createdAt',
    enum: ['id', 'operateurId', 'annee', 'typeTrafic', 'volume', 'createdAt', 'updatedAt']
  })
  @IsOptional()
  @IsString()
  @IsIn(['id', 'operateurId', 'annee', 'typeTrafic', 'volume', 'createdAt', 'updatedAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ 
    description: 'Ordre de tri',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
