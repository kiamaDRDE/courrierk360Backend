import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class UpdateTypeOperateurDto {
  @ApiPropertyOptional({
    description: 'Nom du type d\'opérateur',
    example: 'Opérateur Mobile Premium',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom ne peut pas être vide' })
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères' })
  nom?: string;

  @ApiPropertyOptional({
    description: 'Description du type d\'opérateur',
    example: 'Opérateur spécialisé dans les services premium de téléphonie mobile',
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;
}
