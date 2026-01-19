// src/auth/dto/verify-otp.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email de l\'utilisateur',
    example: 'jean.dupont@example.com',
  })
  @IsEmail({}, { message: 'Email invalide.' })
  @IsNotEmpty({ message: 'L\'email est requis.' })
  email: string;

  @ApiProperty({
    description: 'Code OTP à vérifier',
    example: '123456',
  })
  @IsString({ message: 'Le code OTP doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le code OTP est requis.' })
  otp: string;
}
