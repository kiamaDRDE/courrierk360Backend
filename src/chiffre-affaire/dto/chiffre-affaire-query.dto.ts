import { IsOptional, IsNumber, IsString, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ChiffreAffaireQueryDto {
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
    description: 'Recherche globale dans tous les champs (opérateur, année, montant, description)',
    example: 'MTN'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Montant minimum du chiffre d\'affaire',
    example: 50000
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  chiffreAffaireMin?: number;

  @ApiPropertyOptional({ 
    description: 'Montant maximum du chiffre d\'affaire',
    example: 500000
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  chiffreAffaireMax?: number;

  @ApiPropertyOptional({ 
    description: 'Tri par champ',
    example: 'chiffreAffaire',
    enum: ['id', 'operateurId', 'annee', 'chiffreAffaire', 'createdAt', 'updatedAt']
  })
  @IsOptional()
  @IsString()
  @IsIn(['id', 'operateurId', 'annee', 'chiffreAffaire', 'createdAt', 'updatedAt'])
  sortBy?: string = 'annee';

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
