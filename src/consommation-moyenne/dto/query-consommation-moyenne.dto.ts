import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryConsommationMoyenneDto {
  @ApiPropertyOptional({
    description: 'Filtrer par nom (recherche partielle)',
    example: 'Mobile'
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Valeur minimale',
    example: 50.0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valeurMin?: number;

  @ApiPropertyOptional({
    description: 'Valeur maximale',
    example: 300.0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valeurMax?: number;

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
