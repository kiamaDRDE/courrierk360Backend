import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, ArrayMinSize, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Nom du rôle',
    example: 'Gestionnaire',
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  nom: string;

  @ApiProperty({
    description: 'Description du rôle',
    example: 'Peut gérer les courriers',
    required: false,
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Liste des IDs de permissions à attribuer au rôle',
    example: [1, 2, 5, 7],
    type: [Number],
    required: false,
  })
  @IsArray({ message: 'Les permissions doivent être un tableau' })
  @IsInt({ each: true, message: 'Chaque ID de permission doit être un entier' })
  @Type(() => Number)
  @IsOptional()
  permissions?: number[];
}
