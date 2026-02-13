import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePieceJointeIntituleDto {
  @ApiProperty({
    description: 'Intitulé de la pièce jointe',
    example: 'Nouvel intitulé',
  })
  @IsNotEmpty({ message: "L'intitulé est obligatoire" })
  @IsString({ message: "L'intitulé doit être une chaîne de caractères" })
  intitule: string;
}
