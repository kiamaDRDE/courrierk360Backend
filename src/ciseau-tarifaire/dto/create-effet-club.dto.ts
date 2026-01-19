import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEffetClubDto {
  @ApiProperty({
    description: 'Année du ciseau tarifaire',
    example: 2024,
    type: Number
  })
  @IsNotEmpty({ message: 'L\'année est requise' })
  @IsNumber({}, { message: 'L\'année doit être un nombre' })
  annee: number;

  @ApiProperty({
    description: 'Coût réseau',
    example: 1500000.00,
    type: Number
  })
  @IsNotEmpty({ message: 'Le coût réseau est requis' })
  @IsNumber({}, { message: 'Le coût réseau doit être un nombre' })
  coutReseau: number;

  @ApiProperty({
    description: 'Coûts commerciaux',
    example: 500000.00,
    type: Number
  })
  @IsNotEmpty({ message: 'Les coûts commerciaux sont requis' })
  @IsNumber({}, { message: 'Les coûts commerciaux doivent être un nombre' })
  coutCommerciaux: number;

  @ApiProperty({
    description: 'Coût d\'interconnexion',
    example: 250000.00,
    type: Number
  })
  @IsNotEmpty({ message: 'Le coût d\'interconnexion est requis' })
  @IsNumber({}, { message: 'Le coût d\'interconnexion doit être un nombre' })
  coutInterconnexion: number;

  @ApiProperty({
    description: 'Taxe',
    example: 18.5,
    type: Number
  })
  @IsNotEmpty({ message: 'La taxe est requise' })
  @IsNumber({}, { message: 'La taxe doit être un nombre' })
  taxe: number;
}
