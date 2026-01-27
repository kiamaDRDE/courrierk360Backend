import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { TypeHeure } from '../effet-club.service';

export class EffetClubFilterDto {
  @ApiProperty({
    description: 'Numéro de la page',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La page doit être un nombre' })
  @Min(1, { message: 'La page doit être supérieure ou égale à 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La limite doit être un nombre' })
  @Min(1, { message: 'La limite doit être supérieure ou égale à 1' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Filtrer par ID de l\'opérateur',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID de l\'opérateur doit être un nombre' })
  operateurId?: number;

  @ApiProperty({
    description: 'Filtrer par nom de l\'offre (recherche partielle)',
    example: 'Premium',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  nom?: string;

  @ApiProperty({
    description: 'Filtrer par type d\'offre',
    example: 'Postpayé',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le type d\'offre doit être une chaîne de caractères' })
  typeOffre?: string;

  @ApiProperty({
    description: 'Filtrer par statut',
    example: 'Actif',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le statut doit être une chaîne de caractères' })
  statut?: string;

  @ApiProperty({
    description: 'Filtrer par année',
    example: 2025,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'année doit être un nombre' })
  annee?: number;

  @ApiProperty({
    description: 'Date de début (YYYY-MM-DD)',
    example: '2025-01-01',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La date de début doit être une chaîne de caractères' })
  dateDebut?: string;

  @ApiProperty({
    description: 'Date de fin (YYYY-MM-DD)',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La date de fin doit être une chaîne de caractères' })
  dateFin?: string;

  @ApiProperty({
    description: 'Champ de tri',
    example: 'dateDebutValidite',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le champ de tri doit être une chaîne de caractères' })
  sortBy?: string;

  @ApiProperty({
    description: 'Ordre de tri (asc/desc)',
    example: 'desc',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'L\'ordre de tri doit être une chaîne de caractères' })
  sortOrder?: string;

  
}
