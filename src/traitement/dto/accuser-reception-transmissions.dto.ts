// src/traitement/dto/accuser-reception-transmissions.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsInt } from 'class-validator';

export class AccuserReceptionTransmissionsDto {
  @ApiProperty({
    description: 'Liste des IDs des transmissions à accuser réception',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une transmission doit être sélectionnée' })
  @IsInt({ each: true, message: 'Chaque ID doit être un nombre entier' })
  transmissionIds: number[];
}
