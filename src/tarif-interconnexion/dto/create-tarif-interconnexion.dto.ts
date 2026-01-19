import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTarifInterconnexionDto {
  @ApiProperty({
    description: 'ID de l\'opérateur',
    example: 1,
  })
  @IsInt({ message: 'L\'ID de l\'opérateur doit être un nombre entier' })
  @IsNotEmpty({ message: 'L\'ID de l\'opérateur est obligatoire' })
  @Type(() => Number)
  operateurId: number;

  @ApiProperty({
    description: 'Année du tarif',
    example: 2025,
  })
  @IsInt({ message: 'L\'année doit être un nombre entier' })
  @IsNotEmpty({ message: 'L\'année est obligatoire' })
  @Min(2000, { message: 'L\'année doit être supérieure à 2000' })
  @Type(() => Number)
  annee: number;

  @ApiProperty({
    description: 'Tarif off-net heure creuse',
    example: 25.50,
    type: 'number',
  })
  @IsNumber({}, { message: 'Le tarif off-net heure creuse doit être un nombre' })
  @IsNotEmpty({ message: 'Le tarif off-net heure creuse est obligatoire' })
  @Min(0, { message: 'Le tarif off-net heure creuse doit être positif' })
  @Type(() => Number)
  tarifOffNetHeureCreuse: number;

  @ApiProperty({
    description: 'Tarif off-net heure pleine',
    example: 30.75,
    type: 'number',
  })
  @IsNumber({}, { message: 'Le tarif off-net heure pleine doit être un nombre' })
  @IsNotEmpty({ message: 'Le tarif off-net heure pleine est obligatoire' })
  @Min(0, { message: 'Le tarif off-net heure pleine doit être positif' })
  @Type(() => Number)
  tarifOffNetHeurePleine: number;

  @ApiProperty({
    description: 'Tarif on-net heure creuse',
    example: 15.25,
    type: 'number',
  })
  @IsNumber({}, { message: 'Le tarif on-net heure creuse doit être un nombre' })
  @IsNotEmpty({ message: 'Le tarif on-net heure creuse est obligatoire' })
  @Min(0, { message: 'Le tarif on-net heure creuse doit être positif' })
  @Type(() => Number)
  tarifOnNetHeureCreuse: number;

  @ApiProperty({
    description: 'Tarif on-net heure pleine',
    example: 20.00,
    type: 'number',
  })
  @IsNumber({}, { message: 'Le tarif on-net heure pleine doit être un nombre' })
  @IsNotEmpty({ message: 'Le tarif on-net heure pleine est obligatoire' })
  @Min(0, { message: 'Le tarif on-net heure pleine doit être positif' })
  @Type(() => Number)
  tarifOnNetHeurePleine: number;

  @ApiProperty({
    description: 'Type de tarif',
    example: 'Standard',
    default: 'Standard',
  })
  @IsString({ message: 'Le type de tarif doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le type de tarif est obligatoire' })
  typeTarif: string;

  @ApiPropertyOptional({
    description: 'Description optionnelle du tarif',
    example: 'Tarif applicable pour les appels on-net et off-net avec différentiation heures creuses/pleines',
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;

  @ApiPropertyOptional({
    description: 'IDs des services couverts par ce tarif',
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @IsArray({ message: 'Les serviceIds doivent être un tableau' })
  @IsNumber({}, { each: true, message: 'Chaque ID de service doit être un nombre' })
  serviceIds?: number[];
}
