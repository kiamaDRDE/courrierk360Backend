// src/coffre/dto/create-coffre-item.dto.ts

import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCoffreItemDto {
  @ApiProperty({
    description: 'Nom du coffre',
    example: 'Coffre A1',
  })
  @IsString()
  nom: string;

  @ApiPropertyOptional({
    description: 'Taille maximale du coffre',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tailleMaximale?: number;
}
