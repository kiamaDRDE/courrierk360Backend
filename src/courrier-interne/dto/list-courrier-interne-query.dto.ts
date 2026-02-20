import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class ListCourrierInterneQueryDto {
  @ApiPropertyOptional({ description: 'Recherche globale', example: 'congé' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Date d'arrivée - début (YYYY-MM-DD ou ISO)", example: '2025-12-01' })
  @IsOptional()
  @IsString()
  dateArriveeDebut?: string;

  @ApiPropertyOptional({ description: "Date d'arrivée - fin (YYYY-MM-DD ou ISO)", example: '2025-12-31' })
  @IsOptional()
  @IsString()
  dateArriveeFin?: string;

  @ApiPropertyOptional({ description: "Date d'enregistrement (YYYY-MM-DD ou ISO)", example: '2025-12-10' })
  @IsOptional()
  @IsString()
  dateEnregistrement?: string;

  @ApiPropertyOptional({ description: 'Priorité du courrier', example: 'Haute' })
  @IsOptional()
  @IsString()
  priorite?: string;

  @ApiPropertyOptional({ description: 'Catégorie du courrier', example: 'Administration' })
  @IsOptional()
  @IsString()
  categorie?: string;

  @ApiPropertyOptional({ description: 'ID de catégorie', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categorieId?: number;

  @ApiPropertyOptional({ description: 'ID du type de courrier', example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  typeCourrierId?: number;

  @ApiPropertyOptional({ description: 'Statut du courrier', example: 'Transmis' })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiPropertyOptional({ description: 'Dernier statut de transmission', example: 'Reçu' })
  @IsOptional()
  @IsString()
  dernierStatut?: string;

  @ApiPropertyOptional({ description: 'Service destinataire', example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  serviceId?: number;

  @ApiPropertyOptional({ description: 'Dernier service destinataire', example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dernierServiceId?: number;

  @ApiPropertyOptional({
    description: 'Numéro de la page',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le numéro de page doit être un entier' })
  @Min(1, { message: 'Le numéro de page doit être supérieur ou égal à 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un entier' })
  @Min(1, { message: 'La limite doit être supérieure ou égale à 1' })
  @Max(100, { message: 'La limite ne peut pas dépasser 100 éléments' })
  limit?: number = 10;
}