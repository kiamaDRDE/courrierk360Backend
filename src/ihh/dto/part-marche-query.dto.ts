import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PartMarcheQueryDto {
  @ApiPropertyOptional({ 
    description: 'Numéro de page (0 pour tous les résultats)',
    example: 1,
    minimum: 0
  })
  @IsOptional()
  @IsInt({ message: 'Le numéro de page doit être un nombre entier' })
  @Min(0, { message: 'Le numéro de page doit être supérieur ou égal à 0' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Nombre d\'éléments par page',
    example: 10,
    minimum: 1
  })
  @IsOptional()
  @IsInt({ message: 'La limite doit être un nombre entier' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Filtrer par nom d\'opérateur',
    example: 'Orange'
  })
  @IsOptional()
  @IsString({ message: 'Le nom de l\'opérateur doit être une chaîne de caractères' })
  operateur?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrer par année',
    example: 2024
  })
  @IsOptional()
  @IsInt({ message: 'L\'année doit être un nombre entier' })
  @Min(2000, { message: 'L\'année doit être supérieure ou égale à 2000' })
  @Type(() => Number)
  annee?: number;

  @ApiPropertyOptional({ 
    description: 'Champ de tri',
    example: 'annee',
    enum: ['id', 'operateur', 'annee', 'partMarcheTrafic', 'partMarcheChiffreAffaire', 'partMarcheAbonnes', 'createdAt']
  })
  @IsOptional()
  @IsString({ message: 'Le champ de tri doit être une chaîne de caractères' })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ 
    description: 'Ordre de tri',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsString({ message: 'L\'ordre de tri doit être une chaîne de caractères' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
