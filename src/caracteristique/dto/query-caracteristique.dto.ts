import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryCaracteristiqueDto {
  @ApiPropertyOptional({
    description: 'Numéro de page pour la pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La page doit être un nombre' })
  @Min(1, { message: 'La page doit être supérieure à 0' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La limite doit être un nombre' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  @Max(100, { message: 'La limite ne peut pas dépasser 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Nom de l\'offre pour filtrer',
    example: 'Forfait Premium',
  })
  @IsOptional()
  @IsString({ message: 'Le nom de l\'offre doit être une chaîne de caractères' })
  @Transform(({ value }) => value?.trim())
  nomOffre?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'opérateur pour filtrer',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID de l\'opérateur doit être un nombre' })
  @Min(1, { message: 'L\'ID de l\'opérateur doit être positif' })
  operateurId?: number;

  @ApiPropertyOptional({
    description: 'Type d\'offre pour filtrer',
    example: 'Postpayé',
  })
  @IsOptional()
  @IsString({ message: 'Le type d\'offre doit être une chaîne de caractères' })
  @Transform(({ value }) => value?.trim())
  typeOffre?: string;

  @ApiPropertyOptional({
    description: 'Type de caractéristique pour filtrer (saisie libre)',
    example: 'DUREE_MOYENNE',
  })
  @IsOptional()
  @IsString({ message: 'Le type de caractéristique doit être une chaîne de caractères' })
  @Transform(({ value }) => value?.trim())
  typeCaracteristique?: string;

  @ApiPropertyOptional({
    description: 'Champ de tri',
    example: 'onNet',
    enum: ['onNet', 'offNet', 'international', 'roaming', 'type', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString({ message: 'Le champ de tri doit être une chaîne de caractères' })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Ordre de tri',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString({ message: 'L\'ordre de tri doit être une chaîne de caractères' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
