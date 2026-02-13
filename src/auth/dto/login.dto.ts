// src/auth/dto/login.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Nom d\'utilisateur',
    example: 'jdupont',
  })
  @IsString({ message: 'Le nom d\'utilisateur doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le nom d\'utilisateur est requis.' })
  username: string;

  @ApiProperty({
    description: 'Mot de passe de l\'utilisateur',
    example: 'motDePasseSecurise123',
  })
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  password: string;
}
