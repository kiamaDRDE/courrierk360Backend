// src/coffre/dto/update-coffre.dto.ts

import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateCoffreDto {
  @ApiPropertyOptional({
    description: 'Nom du coffre',
    example: 'Coffre B1',
  })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({
    description: 'Taille maximale du coffre',
    example: 30,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tailleMaximale?: number;

  @ApiPropertyOptional({
    description: 'Nombre de places actuellement occupées',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  nombrePlaceActuelle?: number;

  @ApiPropertyOptional({
    description: 'Le coffre est-il actif ?',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'ID de la salle',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idSalle?: number;
}
