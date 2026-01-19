import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChiffreAffaireDto {
  @ApiProperty({ 
    description: 'ID de l\'opérateur',
    example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  operateurId: number;

  @ApiProperty({ 
    description: 'Année du chiffre d\'affaire', 
    example: 2024 
  })
  @IsNumber()
  @IsNotEmpty()
  annee: number;

  @ApiProperty({ 
    description: 'Montant du chiffre d\'affaire total',
    type: 'string',
    example: '150000.75',
    minimum: 0
  })
  @Transform(({ value }) => value.toString())
  @IsNotEmpty()
  chiffreAffaire: string;

  @ApiPropertyOptional({ 
    description: 'Description du chiffre d\'affaire',
    example: 'Chiffre d\'affaire 2024 incluant tous les services mobiles'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Liste des IDs des services associés au chiffre d\'affaire',
    type: [Number],
    example: [1, 2, 3, 4]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  services: number[];
}
