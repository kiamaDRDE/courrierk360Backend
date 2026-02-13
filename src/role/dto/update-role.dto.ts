import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Nom du rôle',
    example: 'Gestionnaire',
    required: false,
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsOptional()
  nom?: string;

  @ApiProperty({
    description: 'Description du rôle',
    example: 'Peut gérer les courriers',
    required: false,
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @IsOptional()
  description?: string;
}
