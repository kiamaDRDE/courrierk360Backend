import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateProjetDto {
  @ApiProperty({
    description: 'Nom du projet',
    example: 'Digitalisation courrier',
    maxLength: 255,
  })
  @IsString({ message: 'name doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'name est requis' })
  @MaxLength(255, { message: 'name ne doit pas dépasser 255 caractères' })
  name: string;
}
