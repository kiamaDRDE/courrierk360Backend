// src/coffre/dto/create-multiple-coffres.dto.ts

import { IsInt, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCoffreItemDto } from './create-coffre-item.dto';

export class CreateMultipleCoffresDto {
  @ApiProperty({
    description: 'ID de la salle',
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  idSalle: number;

  @ApiProperty({
    description: 'Liste des coffres à créer',
    type: [CreateCoffreItemDto],
    example: [
      { nom: 'Coffre A1', tailleMaximale: 20 },
      { nom: 'Coffre A2', tailleMaximale: 25 },
      { nom: 'Coffre A3' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un coffre doit être fourni.' })
  @ValidateNested({ each: true })
  @Type(() => CreateCoffreItemDto)
  coffres: CreateCoffreItemDto[];
}
