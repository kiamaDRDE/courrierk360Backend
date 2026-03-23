import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListCourrierDepartQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Recherche globale', example: 'CD-2025' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Date d'arrivÃ©e - dÃ©but (YYYY-MM-DD ou ISO)", example: '2025-02-01' })
  @IsOptional()
  @IsString()
  dateArriveeDebut?: string;

  @ApiPropertyOptional({ description: "Date d'arrivÃ©e - fin (YYYY-MM-DD ou ISO)", example: '2025-02-28' })
  @IsOptional()
  @IsString()
  dateArriveeFin?: string;

  @ApiPropertyOptional({ description: "Date d'enregistrement (YYYY-MM-DD)", example: '2025-02-16' })
  @IsOptional()
  @IsString()
  dateEnregistrement?: string;

  @ApiPropertyOptional({ description: 'PrioritÃ© du courrier liÃ©', example: 'Urgent' })
  @IsOptional()
  @IsString()
  priorite?: string;

  @ApiPropertyOptional({ description: 'ID du type de courrier (courrier liÃ©)', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  typeCourrierId?: number;

  @ApiPropertyOptional({ description: 'Statut du courrier liÃ©', example: 'Transmis' })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiPropertyOptional({ description: 'Dernier statut de transmission du courrier liÃ©', example: 'ReÃ§u' })
  @IsOptional()
  @IsString()
  dernierStatut?: string;

  @ApiPropertyOptional({ description: 'Service destinataire du courrier liÃ©', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  serviceId?: number;

  @ApiPropertyOptional({ description: 'Dernier service destinataire du courrier liÃ©', example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dernierServiceId?: number;

  @ApiPropertyOptional({ description: 'Provenance (correspondant) du courrier liÃ©', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  provenanceId?: number;
}

export class CourrierDepartIdsDto {
  @ApiPropertyOptional({ description: 'Liste des IDs de courriers dÃ©part', example: [1, 2, 3] })
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  ids: number[];
}
