import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryTypeOperateurDto {
  @ApiProperty({
    description: 'Nom du type d\'opérateur à rechercher',
    required: false,
    example: 'Mobile',
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  nom?: string;

  @ApiProperty({
    description: 'Description du type d\'opérateur à rechercher',
    required: false,
    example: 'téléphonie',
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;

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
