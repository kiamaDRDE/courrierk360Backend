// src/classe-courrier/dto/update-classe-courrier.dto.ts

import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClasseCourrierDto {
  @ApiPropertyOptional({
    description: 'Nom de la classe de courrier',
    example: 'Courrier Administratif Modifié',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  nom?: string;
}
