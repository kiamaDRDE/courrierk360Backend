// src/forgot-password/forgot-password.controller.ts

import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ForgotPasswordService } from './forgot-password.service';
import { RequestResetDto } from './dto/request-reset.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetToken } from './decorators/reset-token.decorator';

@ApiTags('Forgot Password')
@Controller('forgot-password')
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
        message: 'Les mots de passe ne correspondent pas.',
        data: [],
      },
    },
  },
})
@ApiResponse({
  status: 404,
  description: 'Error 404: Not Found.',
  content: {
    'application/json': {
      example: {
        success: false,
        statusCode: 404,
        code: 'failure',
        title: 'NotFoundException',
        message: 'Aucun compte associé à cet email.',
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
        message: 'Code OTP incorrect.',
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
export class ForgotPasswordController {
  constructor(private readonly forgotPasswordService: ForgotPasswordService) {}

  // 🔐 Demande de réinitialisation de mot de passe
  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Demande de réinitialisation de mot de passe',
    description: 'Génère un code OTP et l\'envoie par email si l\'utilisateur existe.',
  })
  @ApiBody({
    type: RequestResetDto,
    examples: {
      example1: {
        summary: 'Exemple de demande',
        value: {
          email: 'jean.dupont@example.com',
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
          title: 'Demande de réinitialisation',
          message: 'Un code OTP a été généré et envoyé à votre adresse email.',
          data: {
            email: 'jean.dupont@example.com',
            otp: '123456',
            expiresAt: '2025-12-12T12:50:00.000Z',
            expiresIn: '5 minutes',
          },
        },
      },
    },
  })
  async requestReset(@Body() requestResetDto: RequestResetDto) {
    return this.forgotPasswordService.requestReset(requestResetDto);
  }

  // 🔐 Vérification de l'OTP
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vérification du code OTP',
    description: 'Vérifie le code OTP et génère un token temporaire pour la réinitialisation du mot de passe.',
  })
  @ApiBody({
    type: VerifyResetOtpDto,
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
    description: 'Code OTP vérifié avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'OTP vérifié',
          message: 'Code OTP vérifié avec succès. Utilisez le token pour réinitialiser votre mot de passe.',
          data: {
            resetToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            expiresAt: '2025-12-12T13:05:00.000Z',
            expiresIn: '10 minutes',
          },
        },
      },
    },
  })
  async verifyResetOtp(@Body() verifyResetOtpDto: VerifyResetOtpDto) {
    return this.forgotPasswordService.verifyResetOtp(verifyResetOtpDto);
  }

  // 🔐 Réinitialisation du mot de passe (sécurisé par token)
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer') // 🔒 Route sécurisée avec Bearer Token
  @ApiOperation({
    summary: 'Réinitialisation du mot de passe (sécurisé)',
    description: 'Réinitialise le mot de passe de l\'utilisateur en utilisant le token obtenu après vérification de l\'OTP.',
  })
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      example1: {
        summary: 'Exemple de réinitialisation',
        value: {
          password: 'nouveauMotDePasse123',
          confirmPassword: 'nouveauMotDePasse123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès.',
    content: {
      'application/json': {
        example: {
          success: true,
          statusCode: 201,
          code: 'success',
          title: 'Mot de passe réinitialisé',
          message: 'Votre mot de passe a été modifié avec succès. Vous êtes maintenant connecté.',
          data: {
            user: {
              id: 1,
              username: 'jdupont',
              firstName: 'Jean',
              lastName: 'Dupont',
              email: 'jean.dupont@example.com',
              phone: '+237699999999',
              numero: '+237699999999',
              civilite: 'M.',
              isActive: true,
              isSignataire: false,
              idRole: 2,
              idService: 1,
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              expiresToken: '2025-12-12T13:45:00.000Z',
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              refreshExpires: '2025-12-19T12:45:00.000Z',
              createdAt: '2025-12-12T10:41:24.000Z',
              updatedAt: '2025-12-12T12:45:00.000Z',
            },
            accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            expiresIn: '1 hour',
          },
        },
      },
    },
  })
  async resetPassword(
    @ResetToken() resetToken: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.forgotPasswordService.resetPassword(resetToken, resetPasswordDto);
  }
}
