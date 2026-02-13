// src/courrier/dto/close-courrier.dto.ts

import { IsString, IsNotEmpty } from 'class-validator';

export class CloseCourrierDto {
  @IsString()
  @IsNotEmpty()
  dateRemiseEffective: string;
}
