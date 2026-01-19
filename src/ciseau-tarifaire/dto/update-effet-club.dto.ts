import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEffetClubDto {
  @ApiPropertyOptional({
    description: 'Année du ciseau tarifaire',
    example: 2024,
    type: Number
  })
  @IsOptional()
  @IsNumber({}, { message: 'L\'année doit être un nombre' })
  annee?: number;

  @ApiPropertyOptional({
    description: 'Coût réseau',
    example: 1500000.00,
    type: Number
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le coût réseau doit être un nombre' })
  coutReseau?: number;

  @ApiPropertyOptional({
    description: 'Coûts commerciaux',
    example: 500000.00,
    type: Number
  })
  @IsOptional()
  @IsNumber({}, { message: 'Les coûts commerciaux doivent être un nombre' })
  coutCommerciaux?: number;

  @ApiPropertyOptional({
    description: 'Coût d\'interconnexion',
    example: 250000.00,
    type: Number
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le coût d\'interconnexion doit être un nombre' })
  coutInterconnexion?: number;

  @ApiPropertyOptional({
    description: 'Taxe',
    example: 18.5,
    type: Number
  })
  @IsOptional()
  @IsNumber({}, { message: 'La taxe doit être un nombre' })
  taxe?: number;
}
