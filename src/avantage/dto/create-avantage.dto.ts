import { IsString, IsNotEmpty, MaxLength, IsNumber, IsOptional, IsInt, IsArray, ValidateNested, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AvantageItemDto {
  @ApiProperty({
    description: 'Nom de l\'avantage',
    example: 'Réduction de 20%',
    maxLength: 255,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères' })
  nom: string;

  @ApiPropertyOptional({
    description: 'Valeur de l\'avantage',
    example: 20.50,
    type: 'number',
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  @Min(0, { message: 'La valeur doit être supérieure ou égale à 0' })
  @Type(() => Number)
  valeur?: number;

  @ApiPropertyOptional({
    description: 'Indique si l\'avantage est gratuit',
    example: false,
    type: 'boolean',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isGratuit doit être un booléen' })
  @Type(() => Boolean)
  isGratuit?: boolean;
}

export class CreateAvantageDto {
  @ApiPropertyOptional({
    description: 'ID de l\'offre associée (optionnel)',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'L\'ID d\'offre doit être un nombre entier' })
  @Type(() => Number)
  offreId?: number;

  @ApiProperty({
    description: 'Liste des avantages à créer',
    type: [AvantageItemDto],
    example: [
      { nom: 'SMS illimités', valeur: 0 },
      { nom: 'Appels illimités' }, // valeur non renseignée = 0 par défaut
      { nom: 'Réduction 20%', valeur: 20 }
    ]
  })
  @IsArray({ message: 'Les avantages doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => AvantageItemDto)
  avantages: AvantageItemDto[];
}
