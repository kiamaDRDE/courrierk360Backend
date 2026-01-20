import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsNumber, IsPositive, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAvantageDto {
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
    description: 'Indique si l\'avantage est gratuit',
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean({ message: 'isGratuit doit être un booléen' })
  @Type(() => Boolean)
  isGratuit?: boolean;
}
