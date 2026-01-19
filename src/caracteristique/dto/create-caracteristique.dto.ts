import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateCaracteristiqueDto {
  @ApiProperty({
    description: 'ID de l\'offre associée à cette caractéristique',
    example: 1,
  })
  @IsNotEmpty({ message: 'L\'ID de l\'offre est requis' })
  @IsNumber({}, { message: 'L\'ID de l\'offre doit être un nombre' })
  @IsPositive({ message: 'L\'ID de l\'offre doit être positif' })
  offreId: number;

  @ApiProperty({
    description: 'Type de caractéristique',
    example: 'DUREE_MOYENNE',
    enum: ['DUREE_MOYENNE', 'QUALITE_SERVICE', 'COUVERTURE', 'DEBIT'],
  })
  @IsNotEmpty({ message: 'Le type est requis' })
  @IsString({ message: 'Le type doit être une chaîne de caractères' })
  type: string;

  @ApiProperty({
    description: 'Durée moyenne des appels On-net (en secondes)',
    example: 180.50,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'La durée On-net est requise' })
  @IsNumber({}, { message: 'La durée On-net doit être un nombre' })
  @Min(0, { message: 'La durée On-net doit être supérieure ou égale à 0' })
  onNet: number;

  @ApiProperty({
    description: 'Durée moyenne des appels Off-net (en secondes)',
    example: 145.75,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'La durée Off-net est requise' })
  @IsNumber({}, { message: 'La durée Off-net doit être un nombre' })
  @Min(0, { message: 'La durée Off-net doit être supérieure ou égale à 0' })
  offNet: number;

  @ApiProperty({
    description: 'Durée moyenne des appels International (en secondes)',
    example: 95.25,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'La durée International est requise' })
  @IsNumber({}, { message: 'La durée International doit être un nombre' })
  @Min(0, { message: 'La durée International doit être supérieure ou égale à 0' })
  international: number;

  @ApiProperty({
    description: 'Durée moyenne des appels Roaming (en secondes)',
    example: 120.80,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'La durée Roaming est requise' })
  @IsNumber({}, { message: 'La durée Roaming doit être un nombre' })
  @Min(0, { message: 'La durée Roaming doit être supérieure ou égale à 0' })
  roaming: number;
}
