import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, ValidateNested, ArrayMinSize } from 'class-validator';

export class BordereauDataDto {
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

export class CreateBordereauDto {
  @ApiProperty({
    description: 'Liste des bordereaux à créer avec leurs correspondants et courriers',
    type: [BordereauDataDto],
    example: [
      {
        correspondantId: 1,
        courrierIds: [5, 8, 12],
      },
      {
        correspondantId: 2,
        courrierIds: [3, 7],
      },
    ],
  })
  @IsArray({ message: 'bordereauData doit être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un bordereau doit être fourni' })
  @ValidateNested({ each: true })
  @Type(() => BordereauDataDto)
  bordereauData: BordereauDataDto[];

  @ApiProperty({
    description: 'Numéro de référence du bordereau (optionnel)',
    required: false,
    example: 'BT-2025-00001',
  })
  @IsOptional()
  @IsString({ message: 'Le numéro de référence doit être une chaîne de caractères' })
  numeroReference?: string;

  @ApiProperty({
    description: 'Nombre de pièces jointes (optionnel)',
    required: false,
    example: 5,
  })
  @IsOptional()
  @IsInt({ message: 'Le nombre de pièces jointes doit être un entier' })
  nombrePieceJointe?: number;
}
