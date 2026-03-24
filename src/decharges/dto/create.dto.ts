import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDechargeDto {
  @ApiProperty({
    description: 'Date de signature',
    example: '2026-03-24T10:00:00.000Z',
  })
  @IsDateString({}, { message: 'dateSignature doit être une date valide' })
  dateSignature!: string;

  @ApiProperty({ description: 'Signataire', example: 'A-Z ENERGY SARL' })
  @IsString({ message: 'signataire doit être une chaîne de caractères' })
  signataire!: string;

  @ApiPropertyOptional({ description: 'Observation', example: 'RAS' })
  @IsOptional()
  @IsString({ message: 'observation doit être une chaîne de caractères' })
  observation?: string;

  @ApiPropertyOptional({
    description: 'Document (lien/chemin)',
    example: '/public/decharges/decharge-001.pdf',
  })
  @IsOptional()
  @IsString({ message: 'document doit être une chaîne de caractères' })
  document?: string;

  @ApiProperty({ description: 'ID du courrier départ', example: 123 })
  @Type(() => Number)
  @IsInt({ message: "idCourrierDepart doit être un entier" })
  idCourrierDepart!: number;
}
