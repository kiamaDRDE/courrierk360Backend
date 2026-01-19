import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateTypeAppelDto {
  @ApiProperty({
    description: 'Libellé du type d\'appel',
    example: 'Appel international',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le libellé doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le libellé ne peut pas dépasser 255 caractères' })
  libelle?: string;

  @ApiProperty({
    description: 'Description du type d\'appel',
    example: 'Appels effectués vers l\'étranger',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;

  @ApiProperty({
    description: 'Catégorie du type d\'appel',
    example: 'International',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La catégorie doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'La catégorie ne peut pas dépasser 100 caractères' })
  categorie?: string;
}
