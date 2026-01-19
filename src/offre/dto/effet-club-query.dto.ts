import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, Min, IsBoolean, IsDateString } from 'class-validator';

export class EffetClubQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de la page',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La page doit être un nombre' })
  @Min(1, { message: 'La page doit être supérieure ou égale à 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La limite doit être un nombre' })
  @Min(1, { message: 'La limite doit être supérieure ou égale à 1' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrer par ID de l\'opérateur',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID de l\'opérateur doit être un nombre' })
  operateurId?: number;

  @ApiPropertyOptional({
    description: 'Filtrer par ID de l\'offre',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'ID de l\'offre doit être un nombre' })
  offreId?: number;

  @ApiPropertyOptional({
    description: 'Filtrer par nom de l\'offre (recherche partielle)',
    example: 'Forfait Premium',
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  nom?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par type d\'offre',
    example: 'Postpayé',
  })
  @IsOptional()
  @IsString({ message: 'Le type d\'offre doit être une chaîne de caractères' })
  typeOffre?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par statut',
    example: 'Actif',
  })
  @IsOptional()
  @IsString({ message: 'Le statut doit être une chaîne de caractères' })
  statut?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par année',
    example: 2025,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'année doit être un nombre' })
  @Min(2020, { message: 'L\'année doit être supérieure ou égale à 2020' })
  annee?: number;

  @ApiPropertyOptional({
    description: 'Date de début pour filtrer les offres (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de début doit être au format YYYY-MM-DD' })
  dateDebut?: string;

  @ApiPropertyOptional({
    description: 'Date de fin pour filtrer les offres (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être au format YYYY-MM-DD' })
  dateFin?: string;

  @ApiPropertyOptional({
    description: 'Filtrer seulement les offres avec effet de club positif',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'isEffetClub doit être un booléen' })
  isEffetClub?: boolean;

  @ApiPropertyOptional({
    description: 'Valeur minimale de l\'effet de club',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'effet de club minimum doit être un nombre' })
  effetClubMin?: number;

  @ApiPropertyOptional({
    description: 'Valeur maximale de l\'effet de club',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'L\'effet de club maximum doit être un nombre' })
  effetClubMax?: number;

  @ApiPropertyOptional({
    description: 'Trier par champ (nom, dateDebutValidite, effetClub, taOperateur, taMoyen)',
    example: 'effetClub',
    enum: ['nom', 'dateDebutValidite', 'dateFinValidite', 'effetClub', 'taOperateur', 'taMoyen', 'createdAt'],
  })
  @IsOptional()
  @IsString({ message: 'Le champ de tri doit être une chaîne de caractères' })
  sortBy?: string = 'dateDebutValidite';

  @ApiPropertyOptional({
    description: 'Ordre de tri (asc ou desc)',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString({ message: 'L\'ordre de tri doit être asc ou desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
