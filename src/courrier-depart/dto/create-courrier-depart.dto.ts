// src/courrier-depart/dto/create-courrier-depart.dto.ts

import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCourrierDepartDto {
  @IsString()
  @IsNotEmpty()
  numeroReference: string;

  @IsOptional()
  @IsString()
  numeroActe?: string;

  @IsString()
  @IsNotEmpty()
  objet: string;

  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== '' ? Number(value) : value,
  )
  @IsInt()
  @IsNotEmpty()
  idDestinataire: number;

  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== '' ? Number(value) : value,
  )
  @IsInt()
  @IsNotEmpty()
  projet: number;

  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== '' ? Number(value) : value,
  )
  @IsOptional()
  @IsInt()
  idCourrier?: number;

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
  @Transform(({ value }) =>
    value !== undefined && value !== null && value !== '' ? Number(value) : value,
  )
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

