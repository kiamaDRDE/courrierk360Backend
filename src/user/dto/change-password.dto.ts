// src/user/dto/change-password.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Nouveau mot de passe',
    example: 'nouveauMotDePasse123',
    minLength: 6,
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  password: string;

  @ApiProperty({
    description: 'Confirmation du nouveau mot de passe',
    example: 'nouveauMotDePasse123',
  })
  @IsString({ message: 'La confirmation du mot de passe doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'La confirmation du mot de passe est requise.' })
  confirmPassword: string;
}
