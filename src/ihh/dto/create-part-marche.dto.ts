import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min, IsNumberString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreatePartMarcheDto {
  @ApiProperty({ 
    description: 'ID de l\'opérateur',
    example: 1
  })
  @IsInt({ message: 'L\'ID de l\'opérateur doit être un nombre entier' })
  @IsNotEmpty({ message: 'L\'ID de l\'opérateur est obligatoire' })
  @Type(() => Number)
  operateurId: number;

  @ApiProperty({ 
    description: 'Année de la part de marché',
    example: 2024,
    minimum: 2000
  })
  @IsInt({ message: 'L\'année doit être un nombre entier' })
  @Min(2000, { message: 'L\'année doit être supérieure ou égale à 2000' })
  @IsNotEmpty({ message: 'L\'année est obligatoire' })
  @Type(() => Number)
  annee: number;

  @ApiPropertyOptional({ 
    description: 'Part de marché pour le trafic (en pourcentage, 0-100)',
    example: '45.25',
    type: 'string'
  })
  @IsOptional()
  @IsNumberString({}, { message: 'La part de marché trafic doit être un nombre décimal valide' })
  @Transform(({ value }) => value?.toString())
  partMarcheTrafic?: string;

  @ApiPropertyOptional({ 
    description: 'Part de marché pour le chiffre d\'affaires (en pourcentage, 0-100)',
    example: '52.75',
    type: 'string'
  })
  @IsOptional()
  @IsNumberString({}, { message: 'La part de marché chiffre d\'affaires doit être un nombre décimal valide' })
  @Transform(({ value }) => value?.toString())
  partMarcheChiffreAffaire?: string;

  @ApiPropertyOptional({ 
    description: 'Part de marché pour les abonnés (en pourcentage, 0-100)',
    example: '48.90',
    type: 'string'
  })
  @IsOptional()
  @IsNumberString({}, { message: 'La part de marché abonnés doit être un nombre décimal valide' })
  @Transform(({ value }) => value?.toString())
  partMarcheAbonnes?: string;
}
