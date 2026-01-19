// src/signup/dto/signup.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

enum UserRole {
  UTILISATEUR = 'UTILISATEUR',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "Le nom de l'utilisateur",
    example: 'Jean Dupont',
  })
  readonly nom: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: "L'email de l'utilisateur (champ unique)",
    example: 'jean.dupont@example.com',
  })
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "Le numéro de téléphone de l'utilisateur",
    example: '+237699999999',
  })
  readonly numero: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "La fonction de l'utilisateur (optionnel)",
    example: 'Développeur',
    required: false,
  })
  readonly fonction?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: "Le mot de passe de l'utilisateur",
    example: 'motDePasseSecurise123',
  })
  readonly password: string;

  @IsOptional()
  @IsEnum(UserRole)
  @ApiProperty({
    description: "Le rôle de l'utilisateur (par défaut: SUPER_ADMIN)",
    example: 'SUPER_ADMIN',
    enum: UserRole,
    required: false,
  })
  readonly role?: UserRole;
}

