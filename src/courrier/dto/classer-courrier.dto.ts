import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClasserCourrierDto {
  @ApiProperty({
    description: 'Commentaire public pour le classement',
    required: false,
    example: 'Courrier traité et archivé',
  })
  @IsOptional()
  @IsString({ message: 'Le commentaire public doit être une chaîne de caractères' })
  commentairePublic?: string;

  @ApiProperty({
    description: 'Commentaire interne pour le classement',
    required: false,
    example: 'Classé suite à traitement complet',
  })
  @IsOptional()
  @IsString({ message: 'Le commentaire interne doit être une chaîne de caractères' })
  commentaireInterne?: string;
}
