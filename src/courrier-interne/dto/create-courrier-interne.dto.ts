// src/courrier-interne/dto/create-courrier-interne.dto.ts

import { IsOptional, IsString, IsInt, IsNumber, IsBoolean, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourrierInterneDto {
  @IsString()
  @IsNotEmpty()
  classeCourrier: string;

  @IsString()
  @IsNotEmpty()
  typesCourrierIds: string; // JSON string or comma list

  @IsString()
  @IsNotEmpty()
  objet: string;

  @IsOptional()
  @IsString()
  commentairePublic?: string;

  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : value))
  @IsInt()
  idService: number;

  @IsOptional()
  @IsString()
  typeTransmission?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'IDs des transmissions à lier au courrier interne (JSON array ou liste CSV)',
    example: '[10,15,20]',
    required: false
  })
  idTransmissions?: string; // JSON string or comma list des IDs de transmission

  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null && value !== '' ? Number(value) : value))
  @IsNumber()
  nombrePieceJointe?: number;

  @IsOptional()
  @IsString()
  piecesJointesData?: string; // JSON string of intitules

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  sendNotification?: boolean;
}
