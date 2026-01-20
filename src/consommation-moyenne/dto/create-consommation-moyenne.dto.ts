import { IsString, IsNotEmpty, MaxLength, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ConsommationMoyenneItemDto {
  @ApiProperty({
    description: 'Nom de la consommation moyenne',
    example: 'Consommation Mobile Standard',
    maxLength: 255,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères' })
  nom: string;
}

export class CreateConsommationMoyenneDto {
  @ApiPropertyOptional({
    description: 'ID de l\'offre à associer (optionnel)',
    example: 1,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'L\'ID de l\'offre doit être un nombre' })
  @Type(() => Number)
  offreId?: number;

  @ApiProperty({
    description: 'Liste des consommations moyennes à créer',
    type: [ConsommationMoyenneItemDto],
    example: [
      {
        nom: 'Consommation Mobile Standard'
      },
      {
        nom: 'Consommation Mobile Premium'
      },
      {
        nom: 'Consommation Internet'
      }
    ]
  })
  @IsArray({ message: 'Les consommations moyennes doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => ConsommationMoyenneItemDto)
  consommationsMoyennes: ConsommationMoyenneItemDto[];
}
