import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

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
}