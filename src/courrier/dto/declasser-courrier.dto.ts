// src/courrier/dto/declasser-courrier.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeclasserCourrierDto {
  @ApiPropertyOptional({
    description: 'Commentaire public visible par tous',
    example: 'Courrier déclassé pour modification',
  })
  @IsOptional()
  @IsString()
  commentairePublic?: string;

  @ApiPropertyOptional({
    description: 'Commentaire interne à usage administratif',
    example: 'Demande de révision du traitement',
  })
  @IsOptional()
  @IsString()
  commentaireInterne?: string;
}
