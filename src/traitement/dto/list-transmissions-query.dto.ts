import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListTransmissionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Recherche globale sur les champs de la transmission',
    example: 'Transmis',
  })
  @IsOptional()
  @IsString({ message: 'Le terme de recherche doit être une chaîne de caractères' })
  search?: string;

  @ApiPropertyOptional({
    description: "Date d'arrivée - début (YYYY-MM-DD ou ISO)",
    example: '2026-02-01',
  })
  @IsOptional()
  @IsString({ message: 'dateArriveeDebut doit être une chaîne de caractères' })
  dateArriveeDebut?: string;

  @ApiPropertyOptional({
    description: "Date d'arrivée - fin (YYYY-MM-DD ou ISO)",
    example: '2026-02-12',
  })
  @IsOptional()
  @IsString({ message: 'dateArriveeFin doit être une chaîne de caractères' })
  dateArriveeFin?: string;

  @ApiPropertyOptional({
    description: "Date d'enregistrement - début (YYYY-MM-DD ou ISO)",
    example: '2026-02-01',
  })
  @IsOptional()
  @IsString({ message: 'dateEnregistrementDebut doit être une chaîne de caractères' })
  dateEnregistrement?: string;

  @ApiPropertyOptional({
    description: 'Priorité du courrier',
    example: 'Urgent',
  })
  @IsOptional()
  @IsString({ message: 'priorite doit être une chaîne de caractères' })
  priorite?: string;

  @ApiPropertyOptional({
    description: 'Catégorie du courrier (nom)',
    example: 'Administratif',
  })
  @IsOptional()
  @IsString({ message: 'categorie doit être une chaîne de caractères' })
  categorie?: string;

  @ApiPropertyOptional({
    description: 'ID de catégorie (si la catégorie est gérée par la table categories)',
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "categorieId doit être un entier" })
  categorieId?: number;

  @ApiPropertyOptional({
    description: 'ID du type de courrier',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "typeCourrierId doit être un entier" })
  typeCourrierId?: number;

  @ApiPropertyOptional({
    description: 'Statut de la transmission',
    example: 'Transmis',
  })
  @IsOptional()
  @IsString({ message: 'statut doit être une chaîne de caractères' })
  statut?: string;

  @ApiPropertyOptional({
    description: 'Dernier statut de transmission du courrier',
    example: 'Reçu',
  })
  @IsOptional()
  @IsString({ message: 'dernierStatut doit être une chaîne de caractères' })
  dernierStatut?: string;

  @ApiPropertyOptional({
    description: 'Service de la transmission (par défaut: service de l’utilisateur connecté)',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "serviceId doit être un entier" })
  serviceId?: number;

  @ApiPropertyOptional({
    description: 'Dernier service destinataire du courrier',
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "dernierServiceId doit être un entier" })
  dernierServiceId?: number;
}
