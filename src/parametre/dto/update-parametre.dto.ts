import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateParametreDto } from './create-parametre.dto';

export class UpdateParametreDto extends PartialType(CreateParametreDto) {
  @ApiProperty({
    description: 'Type de paramètre (texte libre)',
    example: 'REGLEMENTAIRE',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le type doit être une chaîne de caractères' })
  type?: string;

  @ApiProperty({
    description: 'Année du paramètre',
    example: 2024,
    type: 'integer',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'L\'année doit être un nombre' })
  @Type(() => Number)
  annee?: number;

  @ApiProperty({
    description: 'Coût réseau en francs CFA',
    example: 1200000.00,
    type: 'number',
    format: 'decimal',
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le coût réseau doit être un nombre' })
  @Min(0, { message: 'Le coût réseau ne peut pas être négatif' })
  @Type(() => Number)
  coutReseau?: number;

  @ApiProperty({
    description: 'Redevance FST en francs CFA',
    example: 15000.00,
    type: 'number',
    format: 'decimal',
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La redevance FST doit être un nombre' })
  @Min(0, { message: 'La redevance FST ne peut pas être négative' })
  @Type(() => Number)
  redevanceFst?: number;

  @ApiProperty({
    description: 'Redevance de Régulation en francs CFA',
    example: 25000.00,
    type: 'number',
    format: 'decimal',
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La redevance de régulation doit être un nombre' })
  @Min(0, { message: 'La redevance de régulation ne peut pas être négative' })
  @Type(() => Number)
  redevanceRegulation?: number;

  @ApiProperty({
    description: 'Droit d\'entrée en francs CFA',
    example: 50000.00,
    type: 'number',
    format: 'decimal',
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le droit d\'entrée doit être un nombre' })
  @Min(0, { message: 'Le droit d\'entrée ne peut pas être négatif' })
  @Type(() => Number)
  droitEntree?: number;

  @ApiProperty({
    description: 'Coûts commerciaux en francs CFA',
    example: 35000.00,
    type: 'number',
    format: 'decimal',
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Les coûts commerciaux doivent être un nombre' })
  @Min(0, { message: 'Les coûts commerciaux ne peuvent pas être négatifs' })
  @Type(() => Number)
  coutsCommerciaux?: number;

  @ApiProperty({
    description: 'Taux de TVA en pourcentage',
    example: 18.00,
    type: 'number',
    format: 'decimal',
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La TVA doit être un nombre' })
  @Min(0, { message: 'La TVA ne peut pas être négative' })
  @Type(() => Number)
  tva?: number;

  @ApiProperty({
    description: 'Taxe en francs CFA',
    example: 500000.00,
    type: 'number',
    format: 'decimal',
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La taxe doit être un nombre' })
  @Min(0, { message: 'La taxe ne peut pas être négative' })
  @Type(() => Number)
  taxe?: number;

  @ApiProperty({
    description: 'Coût d\'interconnexion en francs CFA',
    example: 800000.00,
    type: 'number',
    format: 'decimal',
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le coût d\'interconnexion doit être un nombre' })
  @Min(0, { message: 'Le coût d\'interconnexion ne peut pas être négatif' })
  @Type(() => Number)
  coutInterconnexion?: number;
}
