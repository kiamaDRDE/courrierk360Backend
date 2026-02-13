// src/archive/dto/vider-coffres.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class ViderCoffresDto {
  @ApiProperty({
    description: 'Liste des IDs de coffres à vider',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: 'idCoffres doit être un tableau.' })
  @ArrayMinSize(1, { message: 'Au moins un coffre doit être spécifié.' })
  @IsInt({ each: true, message: 'Chaque ID de coffre doit être un entier.' })
  @Type(() => Number)
  idCoffres: number[];
}
