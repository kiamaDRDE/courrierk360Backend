import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class DeletePieceJointeDto {
  @ApiProperty({
    description: 'IDs des pièces jointes à supprimer',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray({ message: 'ids doit être un tableau' })
  @ArrayNotEmpty({ message: 'ids ne doit pas être vide' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'Chaque id doit être un entier' })
  ids: number[];
}
