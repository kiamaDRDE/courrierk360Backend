// src/salle/dto/create-salle.dto.ts

import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalleDto {
  @ApiProperty({
    description: 'Nom de la salle',
    example: 'Salle Archive Centrale',
  })
  @IsString()
  nom: string;

  @ApiPropertyOptional({
    description: 'La salle est-elle active ?',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
