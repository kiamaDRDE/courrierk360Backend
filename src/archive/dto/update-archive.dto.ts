// src/archive/dto/update-archive.dto.ts

import { IsInt, IsArray, IsOptional, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateArchiveDto {
  @ApiPropertyOptional({
    description: 'Liste des IDs de courriers',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsInt({ each: true })
  idCourriers?: number[];

  @ApiPropertyOptional({
    description: 'Liste des IDs de transmissions',
    example: [4, 5],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsInt({ each: true })
  idTransmissions?: number[];

  @ApiPropertyOptional({
    description: 'Liste des IDs de courriers départ',
    example: [6, 7, 8],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsInt({ each: true })
  idCourriersDepart?: number[];

  @ApiPropertyOptional({
    description: 'ID de la salle',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idSalle?: number;

  @ApiPropertyOptional({
    description: 'ID du coffre',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  idCoffre?: number;
}
