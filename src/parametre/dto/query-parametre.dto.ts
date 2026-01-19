import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryParametreDto {
  @ApiProperty({
    description: 'Type de paramètre pour filtrer (texte libre)',
    example: 'REGLEMENTAIRE',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le type doit être une chaîne de caractères' })
  type?: string;

  @ApiProperty({
    description: 'Filtrer par taux de TVA',
    example: 18.00,
    type: 'number',
    format: 'decimal',
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La TVA doit être un nombre' })
  @Type(() => Number)
  tva?: number;

  @ApiProperty({
    description: 'Numéro de page pour la pagination',
    example: 1,
    type: 'integer',
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le numéro de page doit être un nombre' })
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    example: 10,
    type: 'integer',
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La limite doit être un nombre' })
  @Type(() => Number)
  limit?: number;
}
