// src/courrier-depart/dto/create-courrier-depart.dto.ts

import { IsBoolean, IsOptional, IsString, IsInt, IsNumber, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCourrierDepartDto {
  @IsOptional()
  @IsString()
  numeroReference?: string;

  @IsOptional()
  @IsString()
  numeroActe?: string;

  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : value))
  @IsOptional()
  @IsInt()
  idCourrier?: number;

  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : value))
  @IsInt()
  @IsNotEmpty()
  idSignataire: number;

  @IsOptional()
  @IsString()
  provenancesCopie?: string; // JSON string des IDs de correspondants en copie

  @IsString()
  @IsNotEmpty()
  typeCourrier: string;

  @IsOptional()
  @IsString()
  commentaire?: string;

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
