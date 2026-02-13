// src/categories/dto/create-categories.dto.ts

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoriesDto {
  @ApiProperty({
    description: 'Nom de la catégorie',
    example: 'Fournisseur',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nom: string;
}
