import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class BordereauQueryDto {
  @ApiProperty({
    description: 'Numéro de la page (commence à 1)',
    required: false,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Le numéro de page doit être un entier' })
  @Min(1, { message: 'Le numéro de page doit être supérieur ou égal à 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Nombre d\'éléments par page',
    required: false,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un entier' })
  @Min(1, { message: 'La limite doit être supérieure ou égale à 1' })
  limit?: number = 10;

  @ApiProperty({
    description: 'Filtrer par numéro de référence',
    required: false,
    example: 'BT-2025-00001',
  })
  @IsOptional()
  @IsString({ message: 'Le numéro de référence doit être une chaîne de caractères' })
  numeroReference?: string;
}
