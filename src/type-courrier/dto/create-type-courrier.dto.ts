// src/type-courrier/dto/create-type-courrier.dto.ts

import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTypeCourrierDto {
  @ApiProperty({
    description: 'Nom du type de courrier',
    example: 'Courrier Entrant',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom: string;

  @ApiProperty({
    description: 'Type du courrier',
    example: 'ARRIVEE',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type: string;

  @ApiProperty({
    description: 'Classe du courrier',
    example: 'Courrier Administratif',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  classeCourrier?: string;
}
