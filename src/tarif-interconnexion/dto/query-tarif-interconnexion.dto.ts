import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryTarifInterconnexionDto {
  @ApiProperty({
    description: 'Filtrer par ID de l\'opérateur',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  operateurId?: number;

  @ApiProperty({
    description: 'Filtrer par année',
    example: 2025,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  annee?: number;

  @ApiProperty({
    description: 'Filtrer par type de tarif',
    example: 'Standard',
    required: false,
  })
  @IsOptional()
  @IsString()
  typeTarif?: string;

  @ApiProperty({
    description: 'Filtrer par service (chaîne ou tableau JSON, ex: ["Mobile","Fixe"])',
    example: ['Mobile', 'Fixe'],
    required: false,
  })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiProperty({
    description: 'Numéro de page',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page (0 pour tous)',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  limit?: number = 10;
}
