import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, ValidateNested, ArrayMinSize } from 'class-validator';

export class UpdateBordereauDataDto {
  @ApiProperty({
    description: 'ID du bordereau à mettre à jour',
    example: 1,
  })
  @IsInt({ message: 'L\'ID du bordereau doit être un entier' })
  id: number;

  @ApiProperty({
    description: 'ID du correspondant',
    example: 1,
  })
  @IsInt({ message: 'L\'ID du correspondant doit être un entier' })
  correspondantId: number;

  @ApiProperty({
    description: 'Liste des IDs des courriers à associer au bordereau',
    example: [5, 8, 12],
    type: [Number],
  })
  @IsArray({ message: 'courrierIds doit être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un courrier doit être fourni' })
  @IsInt({ each: true, message: 'Chaque ID de courrier doit être un entier' })
  courrierIds: number[];
}

export class UpdateBordereauDto {
  @ApiProperty({
    description: 'Liste des bordereaux à mettre à jour avec leurs correspondants et courriers',
    type: [UpdateBordereauDataDto],
    example: [
      {
        id: 1,
        correspondantId: 1,
        courrierIds: [5, 8, 12],
      },
      {
        id: 2,
        correspondantId: 2,
        courrierIds: [3, 7],
      },
    ],
  })
  @IsArray({ message: 'bordereauData doit être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un bordereau doit être fourni' })
  @ValidateNested({ each: true })
  @Type(() => UpdateBordereauDataDto)
  bordereauData: UpdateBordereauDataDto[];
}
