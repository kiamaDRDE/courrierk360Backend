// src/sms/sms.controller.ts

import { Controller, Get, HttpCode, HttpStatus, UseGuards, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { SmsService } from './sms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('SMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('core/sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consulter le solde SMS disponible',
    description: 'Retourne le solde SMS et les informations de l\'API SMS.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solde SMS récupéré avec succès',
    schema: {
      example: {
        success: true,
        balance: 968,
        qty_acheter: 1000,
        qty_envoye: 32,
        message: 'Solde récupéré avec succès',
        response: {
          success: true,
          msg: 'Solde récupéré avec succès',
          data: { solde: 968, qty_acheter: 1000, qty_envoye: 32 },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur lors de la récupération du solde',
    schema: {
      example: {
        success: false,
        balance: null,
        message: 'Configuration SMS manquante (API_KEY, API_URL ou SENDER)',
        error_type: 'configuration',
      },
    },
  })
  async getBalance(@Res() res: Response) {
    const result = await this.smsService.getSmsBalance();
    const status = result.success ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;
    return res.status(status).json(result);
  }
}
