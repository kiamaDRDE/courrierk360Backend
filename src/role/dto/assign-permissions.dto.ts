import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Liste des IDs de permissions à attribuer au rôle (remplace les anciennes)',
    example: [1, 2, 5, 7],
    type: [Number],
  })
  @IsArray({ message: 'Les permissions doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins une permission doit être fournie' })
  @IsInt({ each: true, message: 'Chaque ID de permission doit être un entier' })
  @Type(() => Number)
  permissions: number[];
}
