// src/traitement/dto/classer-transmission.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClasserTransmissionDto {
  @ApiPropertyOptional({
    description: 'Commentaire public',
    example: 'Courrier traité et classé',
  })
  @IsOptional()
  @IsString()
  commentairePublic?: string;

  @ApiPropertyOptional({
    description: 'Commentaire interne (usage interne)',
    example: 'Notes internes pour l\'équipe',
  })
  @IsOptional()
  @IsString()
  commentaireInterne?: string;
}
