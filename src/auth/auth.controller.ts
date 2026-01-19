// src/auth/auth.controller.ts

import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('Auth')
@Controller('auth')
@ApiResponse({
  status: 400,
  description: 'Error 400: Bad Request.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 400,
        code: 'failure',
        title: 'BadRequestException',
        message: 'Données invalides.',
        data: [],
      },
    },
  },
})
@ApiResponse({
  status: 401,
  description: 'Error 401: Unauthorized.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 401,
        code: 'failure',
        title: 'UnauthorizedException',
        message: 'Email ou mot de passe incorrect.',
        data: [],
      },
    },
  },
})
@ApiResponse({
  status: 500,
  description: 'Error 500: Server error.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 500,
        code: 'failure',
        title: 'InternalServerErrorException',
        message: 'Error 500: Server error.',
        data: [],
      },
    },
  },
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🔐 Connexion et génération d'OTP
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion et génération d\'OTP',
    description: 'Vérifie les identifiants de l\'utilisateur (email + mot de passe), génère un code OTP et l\'envoie par email.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      example1: {
        summary: 'Exemple de connexion',
        value: {
          email: 'jean.dupont@example.com',
          password: 'motDePasseSecurise123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Code OTP généré et envoyé avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Connexion réussie',
          message: 'Un code OTP a été généré et envoyé à votre adresse email.',
          data: {
            email: 'jean.dupont@example.com',
            otp: '123456',
            expiresIn: '5 minutes',
          },
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // 🔐 Vérification de l'OTP et génération des tokens
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vérification de l\'OTP',
    description: 'Vérifie le code OTP, génère un token d\'accès et un refresh token, et retourne les informations de l\'utilisateur.',
  })
  @ApiBody({
    type: VerifyOtpDto,
    examples: {
      example1: {
        summary: 'Exemple de vérification OTP',
        value: {
          email: 'jean.dupont@example.com',
          otp: '123456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP vérifié avec succès, tokens générés.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Authentification réussie',
          message: 'Vous êtes maintenant connecté.',
          data: {
            user: {
              id: 1,
              nom: 'Jean Dupont',
              email: 'jean.dupont@example.com',
              numero: '+237699999999',
              fonction: 'Développeur',
              role: 'UTILISATEUR',
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              expiresToken: '2025-12-12T13:00:00.000Z',
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              refreshExpires: '2025-12-19T12:00:00.000Z',
              createdAt: '2025-12-12T10:41:24.000Z',
              updatedAt: '2025-12-12T12:00:00.000Z',
            },
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            expiresIn: '24 hours',
          },
        },
      },
    },
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  // 🔐 Rafraîchir le token
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rafraîchir le token d\'accès',
    description: 'Génère un nouveau token d\'accès à partir d\'un refresh token valide.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      example1: {
        summary: 'Exemple de rafraîchissement de token',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token rafraîchi avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Token rafraîchi',
          message: 'Votre token d\'accès a été rafraîchi avec succès.',
          data: {
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            expiresIn: '24 hours',
            expiresAt: '2025-12-12T13:00:00.000Z',
          },
        },
      },
    },
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
