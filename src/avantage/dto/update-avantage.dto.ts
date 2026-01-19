import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsNumber, IsPositive, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAvantageDto {
  @ApiPropertyOptional({
    description: 'ID de l\'offre associée (optionnel)',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'L\'ID d\'offre doit être un nombre entier' })
  @Type(() => Number)
  offreId?: number;

  @ApiPropertyOptional({
    description: 'Nom de l\'avantage',
    example: 'Réduction de 20%',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide' })
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères' })
  nom?: string;

  @ApiPropertyOptional({
    description: 'Valeur de l\'avantage',
    example: 20.50,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  @IsPositive({ message: 'La valeur doit être positive' })
  @Type(() => Number)
  valeur?: number;

  @ApiPropertyOptional({
    description: 'Indique si l\'avantage est gratuit',
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean({ message: 'isGratuit doit être un booléen' })
  @Type(() => Boolean)
  isGratuit?: boolean;
}
