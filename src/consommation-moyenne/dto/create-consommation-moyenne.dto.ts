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

  @ApiPropertyOptional({
    description: 'Valeur de la consommation moyenne (en float)',
    example: 125.75,
    type: 'number',
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  @Type(() => Number)
  valeur?: number;
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
        nom: 'Consommation Mobile Standard',
        valeur: 125.75
      },
      {
        nom: 'Consommation Mobile Premium',
        valeur: 250.50
      },
      {
        nom: 'Consommation Internet',
        valeur: 500.25
      }
    ]
  })
  @IsArray({ message: 'Les consommations moyennes doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => ConsommationMoyenneItemDto)
  consommationsMoyennes: ConsommationMoyenneItemDto[];
}

export class UpdateConsommationMoyenneItem {
  @IsNumber({}, { message: 'L\'ID doit être un nombre' })
  id: number;
  
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  valeur: number;
}

export class BulkUpdateConsommationMoyenneDto {
  @ApiProperty({
    description: 'Liste des consommations moyennes avec leurs nouvelles valeurs',
    type: [UpdateConsommationMoyenneItem],
    example: [
      { id: 1, valeur: 150.25 },
      { id: 2, valeur: 200.75 },
      { id: 3, valeur: 75.50 }
    ]
  })
  @IsArray({ message: 'Les mises à jour doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => UpdateConsommationMoyenneItem)
  updates: UpdateConsommationMoyenneItem[];
}
