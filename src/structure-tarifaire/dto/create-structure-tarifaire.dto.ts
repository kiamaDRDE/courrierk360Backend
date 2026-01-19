import { IsString, IsNotEmpty, MaxLength, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateStructureTarifaireDto {
  @ApiProperty({
    description: 'Nom de la structure tarifaire',
    example: 'Tarification Standard',
    maxLength: 255,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères' })
  nom: string;

  @ApiPropertyOptional({
    description: 'Valeur de la structure tarifaire',
    example: 25.50,
    type: 'number',
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  @Min(0, { message: 'La valeur doit être supérieure ou égale à 0' })
  valeur?: number;

  @ApiPropertyOptional({
    description: 'Indique si cette structure tarifaire est obligatoire',
    example: true,
    type: 'boolean',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'estObligatoire doit être un booléen' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  estObligatoire?: boolean;
}
