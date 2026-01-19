import { IsOptional, IsString, IsInt, Min, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryStructureTarifaireDto {
  @ApiProperty({
    description: 'Nom de la structure tarifaire à rechercher',
    required: false,
    example: 'Standard',
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  nom?: string;

  @ApiProperty({
    description: 'Valeur minimale à rechercher',
    required: false,
    example: 10.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La valeur minimale doit être un nombre' })
  valeurMin?: number;

  @ApiProperty({
    description: 'Valeur maximale à rechercher',
    required: false,
    example: 100.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La valeur maximale doit être un nombre' })
  valeurMax?: number;

  @ApiProperty({
    description: 'Filtrer par le caractère obligatoire',
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'estObligatoire doit être un booléen (true/false)' })
  estObligatoire?: boolean;

  @ApiProperty({
    description: 'Numéro de la page',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'La page doit être un nombre entier' })
  @Min(1, { message: 'La page doit être supérieure à 0' })
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    required: false,
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value))
  @IsInt({ message: 'La limite doit être un nombre entier' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  limit?: number = 10;
}
