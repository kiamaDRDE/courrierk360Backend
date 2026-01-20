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

  @ApiProperty({
    description: 'Liste des avantages à créer',
    type: [AvantageItemDto],
    example: [
      { nom: 'SMS illimités', isGratuit: true },
      { nom: 'Appels illimités' },
      { nom: 'Réduction 20%', isGratuit: false }
    ]
  })
  @IsArray({ message: 'Les avantages doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => AvantageItemDto)
  avantages: AvantageItemDto[];
}
