// src/archive/dto/unarchive.dto.ts

import { IsInt, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UnarchiveDto {
  @ApiProperty({
    description: 'Liste des IDs de courriers à désarchiver (optionnel)',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  idCourriers?: number[];

  @ApiProperty({
    description: 'Liste des IDs de transmissions à désarchiver (optionnel)',
    example: [4, 5],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  idTransmissions?: number[];

  @ApiProperty({
    description: 'Liste des IDs de courriers départ à désarchiver (optionnel)',
    example: [6, 7, 8],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  idCourriersDepart?: number[];

  @ApiProperty({
    description: 'ID de la salle (pour validation)',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  idSalle: number;

  @ApiProperty({
    description: 'ID du coffre (pour validation)',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  idCoffre: number;
}