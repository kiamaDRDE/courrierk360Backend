import { IsString, IsOptional, MaxLength, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateConsommationMoyenneDto {
  @ApiPropertyOptional({
    description: 'Nom de la consommation moyenne',
    example: 'Consommation Mobile Standard',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères' })
  nom?: string;

  @ApiPropertyOptional({
    description: 'ID de l\'offre à associer (optionnel)',
    example: 1,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'L\'ID de l\'offre doit être un nombre' })
  @Type(() => Number)
  offreId?: number;
}
