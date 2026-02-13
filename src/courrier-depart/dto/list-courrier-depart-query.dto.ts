import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListCourrierDepartQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Recherche globale', example: 'CD-2025' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Date d'arrivée - début (YYYY-MM-DD ou ISO)", example: '2025-02-01' })
  @IsOptional()
  @IsString()
  dateArriveeDebut?: string;

  @ApiPropertyOptional({ description: "Date d'arrivée - fin (YYYY-MM-DD ou ISO)", example: '2025-02-28' })
  @IsOptional()
  @IsString()
  dateArriveeFin?: string;

  @ApiPropertyOptional({ description: "Date d'enregistrement - début (YYYY-MM-DD ou ISO)", example: '2025-02-01' })
  @IsOptional()
  @IsString()
  dateEnregistrementDebut?: string;

  @ApiPropertyOptional({ description: "Date d'enregistrement - fin (YYYY-MM-DD ou ISO)", example: '2025-02-28' })
  @IsOptional()
  @IsString()
  dateEnregistrementFin?: string;

  @ApiPropertyOptional({ description: 'Priorité du courrier lié', example: 'Urgent' })
  @IsOptional()
  @IsString()
  priorite?: string;

  @ApiPropertyOptional({ description: 'Catégorie du courrier départ', example: 'Administratif' })
  @IsOptional()
  @IsString()
  categorie?: string;

  @ApiPropertyOptional({ description: 'ID de catégorie', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categorieId?: number;

  @ApiPropertyOptional({ description: 'ID du type de courrier (courrier lié)', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  typeCourrierId?: number;

  @ApiPropertyOptional({ description: 'Statut du courrier lié', example: 'Transmis' })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiPropertyOptional({ description: 'Dernier statut de transmission du courrier lié', example: 'Reçu' })
  @IsOptional()
  @IsString()
  dernierStatut?: string;

  @ApiPropertyOptional({ description: 'Service destinataire du courrier lié', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  serviceId?: number;

  @ApiPropertyOptional({ description: 'Dernier service destinataire du courrier lié', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dernierServiceId?: number;

  @ApiPropertyOptional({ description: 'Provenance (correspondant) du courrier lié', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  provenanceId?: number;
}

export class CourrierDepartIdsDto {
  @ApiPropertyOptional({ description: 'Liste des IDs de courriers départ', example: [1, 2, 3] })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];
}