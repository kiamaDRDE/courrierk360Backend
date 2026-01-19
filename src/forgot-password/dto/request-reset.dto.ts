// src/forgot-password/dto/request-reset.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestResetDto {
  @ApiProperty({
    description: 'Email de l\'utilisateur qui a oublié son mot de passe',
    example: 'jean.dupont@example.com',
  })
  @IsEmail({}, { message: 'Email invalide.' })
  @IsNotEmpty({ message: 'L\'email est requis.' })
  email: string;
}
