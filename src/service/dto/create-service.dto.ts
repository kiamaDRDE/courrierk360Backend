// src/service/dto/create-service.dto.ts

import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Nom du service',
    example: 'Direction Générale',
  })
  @IsString()
  nom: string;

  @ApiPropertyOptional({
    description: 'Sigle du service',
    example: 'DG',
  })
  @IsOptional()
  @IsString()
  sigle?: string;

  @ApiPropertyOptional({
    description: 'ID du service parent (pour hiérarchie)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiPropertyOptional({
    description: 'Le service est-il actif ?',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Le service est-il visible dans les transmissions ?',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
