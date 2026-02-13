// src/courrier-depart/dto/create-courrier-depart.dto.ts

import { IsBoolean, IsOptional, IsString, IsInt, IsNumber, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCourrierDepartDto {
  @IsOptional()
  @IsString()
  numeroReference?: string;

  @IsString()
  @IsNotEmpty()
  categorie: string;

  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : value))
  @IsInt()
  idSignataire: number;

  @IsString()
  @IsNotEmpty()
  classeCourrier: string;

  @IsString()
  @IsNotEmpty()
  typeCourrier: string;

  @IsString()
  @IsNotEmpty()
  dateSignature: string;

  @IsOptional()
  @IsString()
  commentaire?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  numeroTelephone?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : value))
  @IsNumber()
  nombrePieceJointe?: number;

  @IsOptional()
  @IsString()
  piecesJointesData?: string; // JSON string des intitulés

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  sendNotification?: boolean;
}
