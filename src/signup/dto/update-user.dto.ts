// src/signup/dto/update-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

enum UserRole {
  UTILISATEUR = 'UTILISATEUR',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Le nom de l'utilisateur",
    example: 'Jean Dupont',
    required: false,
  })
  readonly nom?: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({
    description: "L'email de l'utilisateur",
    example: 'jean.dupont@example.com',
    required: false,
  })
  readonly email?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Le numéro de téléphone de l'utilisateur",
    example: '+237699999999',
    required: false,
  })
  readonly numero?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "La fonction de l'utilisateur",
    example: 'Développeur Senior',
    required: false,
  })
  readonly fonction?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: "Le nouveau mot de passe de l'utilisateur",
    example: 'nouveauMotDePasse123',
    required: false,
  })
  readonly password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  @ApiProperty({
    description: "Le rôle de l'utilisateur",
    example: 'UTILISATEUR',
    enum: UserRole,
    required: false,
  })
  readonly role?: UserRole;
}
