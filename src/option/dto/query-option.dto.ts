import { IsOptional, IsString, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryOptionDto {
  @ApiPropertyOptional({
    description: 'Filtrer par nom d\'option (recherche partielle)',
    example: 'Premium'
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Filtrer par ID d\'offre',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offreId?: number;

  @ApiPropertyOptional({
    description: 'Filtrer par année',
    example: 2026
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  annee?: number;

  @ApiPropertyOptional({
    description: 'Valeur de trafic minimale',
    example: 500.0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  traficMin?: number;

  @ApiPropertyOptional({
    description: 'Valeur de trafic maximale',
    example: 2000.0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  traficMax?: number;

  @ApiPropertyOptional({
    description: 'Nombre minimum de souscriptions',
    example: 1000
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  nombreSouscriptionsMin?: number;

  @ApiPropertyOptional({
    description: 'Nombre maximum de souscriptions',
    example: 5000
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  nombreSouscriptionsMax?: number;

  @ApiPropertyOptional({
    description: 'Numéro de page',
    example: 1,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 10,
    default: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
