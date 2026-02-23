// src/correspondant/dto/create-correspondant.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength, IsArray, ArrayMinSize, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCorrespondantDto {
  @ApiProperty({
    description: 'Civilité du correspondant',
    example: 'M.',
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  civilite?: string;

  @ApiProperty({
    description: 'Nom du correspondant',
    example: 'Dupont Martin',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom: string;

  @ApiProperty({
    description: 'Email du correspondant',
    example: 'martin.dupont@example.com',
    maxLength: 191,
    required: false,
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(191)
  email?: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+33 1 23 45 67 89',
    maxLength: 50,
  })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    telephone?: string;

  @ApiProperty({
    description: 'Adresse du correspondant',
    example: '123 Rue de la République, Paris',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  adresse?: string;

  @ApiProperty({
    description: 'IDs des catégories associées (obligatoire, au moins une catégorie)',
    example: [1, 3, 5],
    type: [Number],
    isArray: true,
  })
    @IsArray()
    @IsOptional()
    @IsInt({ each: true })
    @Type(() => Number)
    categories?: number[];

  @ApiProperty({
    description: 'Type du correspondant',
    example: 'ENTREPRISE',
    maxLength: 100,
  })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    type?: string;

  @ApiProperty({
    description: 'Matricule du correspondant',
    example: 'CORR-2026-001',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  matricule?: string;
}
