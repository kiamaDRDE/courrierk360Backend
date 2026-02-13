// src/archive/dto/retirer-archives.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class RetirerArchiveItemDto {
  @ApiProperty({
    description: 'ID du coffre',
    example: 10,
  })
  @IsInt({ message: 'coffreId doit être un entier.' })
  @Type(() => Number)
  coffreId: number;

  @ApiProperty({
    description: 'Liste des IDs de courriers à retirer (optionnel)',
    example: [1, 3, 5],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'courrierIds doit être un tableau.' })
  @IsInt({ each: true, message: 'Chaque ID de courrier doit être un entier.' })
  @Type(() => Number)
  courrierIds?: number[];

  @ApiProperty({
    description: 'Liste des IDs de transmissions à retirer (optionnel)',
    example: [2, 4],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'transmissionIds doit être un tableau.' })
  @IsInt({ each: true, message: 'Chaque ID de transmission doit être un entier.' })
  @Type(() => Number)
  transmissionIds?: number[];

  @ApiProperty({
    description: 'Liste des IDs de courriers départ à retirer (optionnel)',
    example: [6, 8],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'courrierDepartIds doit être un tableau.' })
  @IsInt({ each: true, message: 'Chaque ID de courrier départ doit être un entier.' })
  @Type(() => Number)
  courrierDepartIds?: number[];
}

export class RetirerArchivesDto {
  @ApiProperty({
    description: 'Liste des coffres et éléments à retirer',
    type: [RetirerArchiveItemDto],
    example: [
      {
        coffreId: 10,
        courrierIds: [1, 3, 5],
        transmissionIds: [2, 4],
        courrierDepartIds: [6, 8],
      },
      {
        coffreId: 20,
        courrierIds: [15, 18],
        transmissionIds: [],
        courrierDepartIds: [25, 30],
      },
    ],
  })
  @IsArray({ message: 'items doit être un tableau.' })
  @ArrayMinSize(1, { message: 'Au moins un élément doit être spécifié.' })
  @ValidateNested({ each: true })
  @Type(() => RetirerArchiveItemDto)
  items: RetirerArchiveItemDto[];
}
