// src/auth/dto/refresh-token.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token pour générer un nouveau token d\'accès',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'Le refresh token doit être une chaîne de caractères.' })
  @IsNotEmpty({ message: 'Le refresh token est requis.' })
  refreshToken: string;
}
