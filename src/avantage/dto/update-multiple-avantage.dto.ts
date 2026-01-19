import { IsArray, ValidateNested, ArrayMinSize, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateAvantageDto } from './update-avantage.dto';

export class UpdateAvantageItemDto extends UpdateAvantageDto {
  @ApiProperty({
    description: 'ID de l\'avantage à mettre à jour',
    example: 1,
  })
  @IsNumber({}, { message: 'L\'ID doit être un nombre' })
  id: number;
}

export class UpdateMultipleAvantageDto {
  @ApiProperty({
    description: 'Liste des avantages à mettre à jour',
    type: [UpdateAvantageItemDto],
    example: [
      {
        id: 1,
        nom: 'SMS illimités Premium',
        valeur: 0,
        offreId: 2
      },
      {
        id: 2,
        nom: 'Appels illimités Modifiés'
        // valeur non renseignée = pas de modification de la valeur
      },
      {
        id: 3,
        valeur: 25.00
        // nom non renseigné = pas de modification du nom
      }
    ]
  })
  @IsArray({ message: 'Les avantages doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un avantage est requis' })
  @ValidateNested({ each: true })
  @Type(() => UpdateAvantageItemDto)
  avantages: UpdateAvantageItemDto[];
}
