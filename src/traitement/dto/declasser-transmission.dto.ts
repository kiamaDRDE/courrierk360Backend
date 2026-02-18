// src/traitement/dto/declasser-transmission.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeclasserTransmissionDto {
  @ApiPropertyOptional({
    description: 'Commentaire public visible par tous',
    example: 'Transmission déclassée pour révision',
  })
  @IsOptional()
  @IsString()
  commentairePublic?: string;

  @ApiPropertyOptional({
    description: 'Commentaire interne à usage administratif',
    example: 'Demande de modification du traitement',
  })
  @IsOptional()
  @IsString()
  commentaireInterne?: string;
}
