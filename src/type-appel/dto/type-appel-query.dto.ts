import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class TypeAppelQueryDto {
  @ApiProperty({
    description: 'Numéro de la page',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La page doit être un nombre' })
  @Min(1, { message: 'La page doit être supérieure ou égale à 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page (0 pour tous)',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La limite doit être un nombre' })
  @Min(0, { message: 'La limite doit être supérieure ou égale à 0' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Filtrer par libellé (recherche partielle)',
    example: 'national',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le libellé doit être une chaîne de caractères' })
  libelle?: string;

  @ApiProperty({
    description: 'Filtrer par catégorie',
    example: 'Fixe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  categorie?: string;
}
