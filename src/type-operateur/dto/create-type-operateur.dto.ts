import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTypeOperateurDto {
  @ApiProperty({
    description: 'Nom du type d\'opérateur',
    example: 'Opérateur Mobile',
    maxLength: 255,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @MaxLength(255, { message: 'Le nom ne doit pas dépasser 255 caractères' })
  nom: string;

  @ApiPropertyOptional({
    description: 'Description du type d\'opérateur',
    example: 'Opérateur spécialisé dans les services de téléphonie mobile',
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  description?: string;
}
