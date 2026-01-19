// src/auth/dto/login.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email de l\'utilisateur',
    example: 'jean.dupont@example.com',
  })
  @IsEmail({}, { message: 'Email invalide.' })
  @IsNotEmpty({ message: 'L\'email est requis.' })
  email: string;

  @ApiProperty({
    description: 'Mot de passe de l\'utilisateur',
    example: 'motDePasseSecurise123',
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  password: string;
}
