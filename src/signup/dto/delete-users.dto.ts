// src/signup/dto/delete-users.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';

export class DeleteUsersDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un ID doit être fourni.' })
  @IsNumber({}, { each: true })
  @ApiProperty({
    description: 'Liste des IDs des utilisateurs à supprimer',
    example: [1, 2, 3],
    type: [Number],
  })
  readonly ids: number[];
}
