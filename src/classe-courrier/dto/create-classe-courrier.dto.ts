// src/classe-courrier/dto/create-classe-courrier.dto.ts

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClasseCourrierDto {
  @ApiProperty({
    description: 'Nom de la classe de courrier',
    example: 'Courrier Administratif',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  nom: string;
}
