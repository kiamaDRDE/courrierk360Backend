import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  MaxLength,
  IsPositive,
  IsArray,
} from 'class-validator';

export class UpdateOffreDto {
  @ApiProperty({
    description: 'ID de l\'opérateur',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'L\'ID de l\'opérateur doit être un nombre' })
  @IsPositive({ message: 'L\'ID de l\'opérateur doit être positif' })
  operateurId?: number;

  @ApiProperty({
    description: 'Nom de l\'offre',
    example: 'Forfait Mobile Premium',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  nom?: string;

  @ApiProperty({
    description: 'Année de l\'offre',
    example: 2025,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'L\'année doit être un nombre' })
  @IsPositive({ message: 'L\'année doit être positive' })
  annee?: number;

  @ApiProperty({
    description: 'Date de début de validité',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de début doit être au format ISO 8601' })
  dateDebutValidite?: string;

  @ApiProperty({
    description: 'Date de fin de validité',
    example: '2025-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'La date de fin doit être au format ISO 8601' })
  dateFinValidite?: string;

  @ApiProperty({
    description: 'Type d\'offre',
    example: 'Postpayé',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le type d\'offre doit être une chaîne de caractères' })
  @MaxLength(100, { message: 'Le type d\'offre ne peut pas dépasser 100 caractères' })
  typeOffre?: string;

  @ApiProperty({
    description: 'Destination',
    example: 'International',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La destination doit être une chaîne de caractères' })
  @MaxLength(255, { message: 'La destination ne peut pas dépasser 255 caractères' })
  destination?: string;

  @ApiProperty({
    description: 'IDs des services associés à l\'offre',
    example: [1, 3],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Les IDs des services doivent être un tableau' })
  @IsNumber({}, { each: true, message: 'Chaque ID de service doit être un nombre' })
  @IsPositive({ each: true, message: 'Chaque ID de service doit être positif' })
  serviceIds?: number[];

  @ApiProperty({
    description: 'Statut de l\'offre',
    example: 'Inactif',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Le statut doit être une chaîne de caractères' })
  @MaxLength(50, { message: 'Le statut ne peut pas dépasser 50 caractères' })
  statut?: string;

  @ApiProperty({
    description: 'Description de l\'offre',
    example: 'Offre premium avec services additionnels',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;



  // 🔄 NOUVEAUX CHAMPS TARIFAIRES
  @ApiProperty({
    description: 'Tarif de péréquation OnNet (TP)',
    example: 150.75,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'TP doit être un nombre' })
  @IsPositive({ message: 'TP doit être positif' })
  tp?: number;

  @ApiProperty({
    description: 'Tarif de numérotation courte OnNet (TNC)',
    example: 125.30,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'TNC doit être un nombre' })
  @IsPositive({ message: 'TNC doit être positif' })
  tnc?: number;

  @ApiProperty({
    description: 'Encaissement postal OnNet (EP)',
    example: 85.25,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'EP doit être un nombre' })
  @IsPositive({ message: 'EP doit être positif' })
  ep?: number;










}
