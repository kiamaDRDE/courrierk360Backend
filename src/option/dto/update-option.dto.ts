import { IsString, IsOptional, MaxLength, IsNumber, IsArray, IsInt, Min, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StructureTarifaireWithValueDto {
  @ApiPropertyOptional({
    description: 'ID de la structure tarifaire',
    example: 1,
    type: 'number',
  })
  @IsNumber({}, { message: 'L\'ID de la structure tarifaire doit être un nombre' })
  @Type(() => Number)
  id: number;

  @ApiPropertyOptional({
    description: 'Valeur à assigner à cette structure tarifaire',
    example: 50.25,
    type: 'number',
  })
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  @Type(() => Number)
  valeur: number;
}

export class AvantageWithValueDto {
  @ApiPropertyOptional({
    description: 'ID de l\'avantage',
    example: 1,
    type: 'number',
  })
  @IsNumber({}, { message: 'L\'ID de l\'avantage doit être un nombre' })
  @Type(() => Number)
  id: number;

  @ApiPropertyOptional({
    description: 'Valeur à assigner à cet avantage',
    example: 500,
    type: 'number',
  })
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  @Type(() => Number)
  valeur: number;
}

export class ConsommationMoyenneWithValueDto {
  @ApiPropertyOptional({
    description: 'ID de la consommation moyenne',
    example: 2,
    type: 'number',
  })
  @IsNumber({}, { message: 'L\'ID de la consommation moyenne doit être un nombre' })
  @Type(() => Number)
  id: number;

  @ApiPropertyOptional({
    description: 'Valeur à assigner à cette consommation moyenne',
    example: 125.75,
    type: 'number',
  })
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  @Type(() => Number)
  valeur: number;
}

export class UpdateOptionDto {
  @ApiPropertyOptional({
    description: 'ID de l\'offre à associer',
    example: 1,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'L\'ID de l\'offre doit être un nombre' })
  @Type(() => Number)
  offreId?: number;

  @ApiPropertyOptional({
    description: 'Nom de l\'option',
    example: 'Option Premium Mobile+',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères' })
  nom?: string;

  @ApiPropertyOptional({
    description: 'Taux de TVA en pourcentage',
    example: 19.25,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le champ TVA doit être un nombre' })
  @Type(() => Number)
  tva?: number;

  @ApiPropertyOptional({
    description: 'Nombre de souscriptions',
    example: 1750,
    type: 'integer',
  })
  @IsOptional()
  @IsInt({ message: 'Le nombre de souscriptions doit être un entier' })
  @Min(0, { message: 'Le nombre de souscriptions doit être positif' })
  @Type(() => Number)
  nombreSouscriptions?: number;

  @ApiPropertyOptional({
    description: 'Trafic Option',
    example: 30.00,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Les Trafic Option doivent être un nombre' })
  @Type(() => Number)
  traficOption?: number;

  @ApiPropertyOptional({
    description: 'Frais de souscription',
    example: 30.00,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Les frais de souscription doivent être un nombre' })
  @Type(() => Number)
  fraisSouscription?: number;

  @ApiPropertyOptional({
    description: 'Tarif minute On-Net (communication vers le même réseau)',
    example: 18.00,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le tarif minute On-Net doit être un nombre' })
  @Type(() => Number)
  tarifMinuteOnNet?: number;

  @ApiPropertyOptional({
    description: 'Tarif minute Off-Net (communication vers autres réseaux)',
    example: 25.50,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le tarif minute Off-Net doit être un nombre' })
  @Type(() => Number)
  tarifMinuteOffNet?: number;

  @ApiPropertyOptional({
    description: 'Année de l\'option',
    example: 2027,
    type: 'integer',
  })
  @IsOptional()
  @IsInt({ message: 'L\'année doit être un entier' })
  @Min(2020, { message: 'L\'année doit être au minimum 2020' })
  @Type(() => Number)
  annee?: number;

  @ApiPropertyOptional({
    description: 'Volume de trafic associé à l\'option',
    example: 2250.50,
    type: 'number',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le trafic doit être un nombre' })
  @Min(0, { message: 'Le trafic doit être positif ou nul' })
  @Type(() => Number)
  trafic?: number;

  @ApiPropertyOptional({
    description: 'Structures tarifaires à associer avec leurs valeurs',
    example: [
      { id: 1, valeur: 55.30 },
      { id: 3, valeur: 80.75 }
    ],
    type: [StructureTarifaireWithValueDto],
  })
  @IsOptional()
  @IsArray({ message: 'Les structures tarifaires doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => StructureTarifaireWithValueDto)
  structuresTarifaires?: StructureTarifaireWithValueDto[];

  @ApiPropertyOptional({
    description: 'Avantages à associer avec leurs valeurs',
    example: [
      { id: 2, valeur: 750 },
      { id: 4, valeur: 1200 },
      { id: 6, valeur: 100 }
    ],
    type: [AvantageWithValueDto],
  })
  @IsOptional()
  @IsArray({ message: 'Les avantages doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => AvantageWithValueDto)
  avantages?: AvantageWithValueDto[];

  @ApiPropertyOptional({
    description: 'Consommations moyennes à associer avec leurs valeurs',
    example: [
      { id: 1, valeur: 180.50 },
      { id: 3, valeur: 300.75 },
      { id: 5, valeur: 450.25 }
    ],
    type: [ConsommationMoyenneWithValueDto],
  })
  @IsOptional()
  @IsArray({ message: 'Les consommations moyennes doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => ConsommationMoyenneWithValueDto)
  consommationsMoyennes?: ConsommationMoyenneWithValueDto[];
}
