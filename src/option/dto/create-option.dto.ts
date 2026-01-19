import { IsString, IsNotEmpty, MaxLength, IsNumber, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StructureTarifaireWithValueDto {
  @ApiProperty({
    description: 'ID de la structure tarifaire',
    example: 1,
    type: 'number',
  })
  @IsNumber({}, { message: 'L\'ID de la structure tarifaire doit être un nombre' })
  @Type(() => Number)
  id: number;

  @ApiProperty({
    description: 'Valeur à assigner à cette structure tarifaire',
    example: 50.25,
    type: 'number',
  })
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  @Type(() => Number)
  valeur: number;
}

export class AvantageWithValueDto {
  @ApiProperty({
    description: 'ID de l\'avantage',
    example: 1,
    type: 'number',
  })
  @IsNumber({}, { message: 'L\'ID de l\'avantage doit être un nombre' })
  @Type(() => Number)
  id: number;

  @ApiProperty({
    description: 'Valeur à assigner à cet avantage',
    example: 500,
    type: 'number',
  })
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  @Type(() => Number)
  valeur: number;
}

export class ConsommationMoyenneWithValueDto {
  @ApiProperty({
    description: 'ID de la consommation moyenne',
    example: 2,
    type: 'number',
  })
  @IsNumber({}, { message: 'L\'ID de la consommation moyenne doit être un nombre' })
  @Type(() => Number)
  id: number;

  @ApiProperty({
    description: 'Valeur à assigner à cette consommation moyenne',
    example: 125.75,
    type: 'number',
  })
  @IsNumber({}, { message: 'La valeur doit être un nombre' })
  @Type(() => Number)
  valeur: number;
}

export class CreateOptionDto {
  @ApiProperty({
    description: 'ID de l\'offre à associer',
    example: 1,
    type: 'number',
  })
  @IsNumber({}, { message: 'L\'ID de l\'offre doit être un nombre' })
  @Type(() => Number)
  offreId: number;

  @ApiProperty({
    description: 'Nom de l\'option',
    example: 'Option Premium Mobile',
    maxLength: 255,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères' })
  nom: string;

  @ApiProperty({
    description: 'Taux de TVA en pourcentage',
    example: 18.00,
    type: 'number',
  })
  @IsNumber({}, { message: 'Le champ TVA doit être un nombre' })
  @Type(() => Number)
  tva: number;

  @ApiProperty({
    description: 'Nombre de souscriptions',
    example: 1500,
    type: 'integer',
  })
  @IsInt({ message: 'Le nombre de souscriptions doit être un entier' })
  @Min(0, { message: 'Le nombre de souscriptions doit être positif' })
  @Type(() => Number)
  nombreSouscriptions: number;

  @ApiProperty({
    description: 'Trafic Option',
    example: 25.00,
    type: 'number',
  })
  @IsNumber({}, { message: 'Les Trafic Option doivent être un nombre' })
  @Type(() => Number)
  traficOption: number;

  @ApiProperty({
    description: 'Frais de souscription',
    example: 25.00,
    type: 'number',
  })
  @IsNumber({}, { message: 'Les frais de souscription doivent être un nombre' })
  @Type(() => Number)
  fraisSouscription: number;

  @ApiProperty({
    description: 'Tarif minute On-Net (communication vers le même réseau)',
    example: 15.50,
    type: 'number',
  })
  @IsNumber({}, { message: 'Le tarif minute On-Net doit être un nombre' })
  @Type(() => Number)
  tarifMinuteOnNet: number;

  @ApiProperty({
    description: 'Tarif minute Off-Net (communication vers autres réseaux)',
    example: 22.75,
    type: 'number',
  })
  @IsNumber({}, { message: 'Le tarif minute Off-Net doit être un nombre' })
  @Type(() => Number)
  tarifMinuteOffNet: number;

  @ApiProperty({
    description: 'Année de l\'option',
    example: 2026,
    type: 'integer',
  })
  @IsInt({ message: 'L\'année doit être un entier' })
  @Min(2020, { message: 'L\'année doit être au minimum 2020' })
  @Type(() => Number)
  annee: number;

  @ApiPropertyOptional({
    description: 'Volume de trafic associé à l\'option',
    example: 1500.75,
    type: 'number',
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le trafic doit être un nombre' })
  @Min(0, { message: 'Le trafic doit être positif ou nul' })
  @Type(() => Number)
  trafic?: number;

  @ApiPropertyOptional({
    description: 'Structures tarifaires à associer avec leurs valeurs (par défaut 2)',
    example: [
      { id: 1, valeur: 50.25 },
      { id: 2, valeur: 75.50 }
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
      { id: 1, valeur: 500 },
      { id: 3, valeur: 1000 },
      { id: 5, valeur: 50 }
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
      { id: 2, valeur: 125.75 },
      { id: 4, valeur: 250.50 }
    ],
    type: [ConsommationMoyenneWithValueDto],
  })
  @IsOptional()
  @IsArray({ message: 'Les consommations moyennes doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => ConsommationMoyenneWithValueDto)
  consommationsMoyennes?: ConsommationMoyenneWithValueDto[];
}
