// src/operateur/dto/update-operateur.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';

export class UpdateOperateurDto {
  @ApiProperty({
    description: 'Nom de l\'opérateur',
    example: 'MTN Cameroon',
    required: false,
  })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiProperty({
    description: 'Code de l\'opérateur',
    example: 'MTN',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Description de l\'opérateur',
    example: 'Opérateur de télécommunication mobile et fixe',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type de l\'opérateur',
    example: 'Mobile',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'IDs des services fournis par l\'opérateur',
    example: [1, 2],
    required: false,
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  serviceIds?: number[];

  @ApiProperty({
    description: 'Année de création de l\'opérateur (4 chiffres)',
    example: 1995,
    required: false,
    minimum: 1800,
    maximum: new Date().getFullYear(),
  })
  @IsOptional()
  @IsNumber({}, { message: 'L\'année de création doit être un nombre' })
  @Min(1800, { message: 'L\'année de création doit être supérieure à 1800' })
  @Max(new Date().getFullYear(), { message: 'L\'année de création ne peut pas être dans le futur' })
  anneeCreation?: number;

  @ApiProperty({
    description: 'Statut de l\'opérateur',
    example: 'Actif',
    required: false,
  })
  @IsString()
  @IsOptional()
  statut?: string;
}
