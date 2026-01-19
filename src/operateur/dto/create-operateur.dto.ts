// src/operateur/dto/create-operateur.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';

export class CreateOperateurDto {
  @ApiProperty({
    description: 'Nom de l\'opérateur',
    example: 'MTN Cameroon',
  })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({
    description: 'Code de l\'opérateur',
    example: 'MTN',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Description de l\'opérateur',
    example: 'Opérateur de télécommunication mobile',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type de l\'opérateur',
    example: 'Mobile',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'IDs des services fournis par l\'opérateur',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty({ each: true })
  serviceIds: number[];

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
  })
  @IsString()
  @IsNotEmpty()
  statut: string;
}
