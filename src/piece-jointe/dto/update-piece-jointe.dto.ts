import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePieceJointeDto {
  @ApiPropertyOptional({
    description: 'Intitulé de la pièce jointe',
    example: 'Justificatif de domicile',
  })
  @IsOptional()
  @IsString({ message: "L'intitulé doit être une chaîne de caractères" })
  intitule?: string;

  @ApiPropertyOptional({
    description: 'Type du parent (courrier/transmission/etc.)',
    example: 'courrier',
  })
  @IsOptional()
  @IsString({ message: 'typeParent doit être une chaîne de caractères' })
  typeParent?: string;

  @ApiPropertyOptional({
    description: 'ID du parent',
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'idParent doit être un entier' })
  idParent?: number;

  @ApiPropertyOptional({
    description: 'ID de la transmission',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'idTransmission doit être un entier' })
  idTransmission?: number;

  @ApiPropertyOptional({
    description: 'ID du courrier',
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'idCourrier doit être un entier' })
  idCourrier?: number;
}
