import { IsArray, ValidateNested, ArrayMinSize, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateStructureTarifaireDto } from './update-structure-tarifaire.dto';

export class UpdateStructureTarifaireItemDto extends UpdateStructureTarifaireDto {
  @ApiProperty({
    description: 'ID de la structure tarifaire à mettre à jour',
    example: 1,
  })
  @IsNumber({}, { message: 'L\'ID doit être un nombre' })
  id: number;
}

export class UpdateMultipleStructureTarifaireDto {
  @ApiProperty({
    description: 'Liste des structures tarifaires à mettre à jour',
    type: [UpdateStructureTarifaireItemDto],
    example: [
      {
        id: 1,
        nom: 'Tarification Standard Modifiée',
        valeur: 30.00,
        estObligatoire: true
      },
      {
        id: 2,
        nom: 'Tarification Premium Modifiée',
        valeur: 50.00,
        estObligatoire: false
      }
    ]
  })
  @IsArray({ message: 'Les structures doivent être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins une structure tarifaire est requise' })
  @ValidateNested({ each: true })
  @Type(() => UpdateStructureTarifaireItemDto)
  structures: UpdateStructureTarifaireItemDto[];
}
