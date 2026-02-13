// src/sms/sms.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SmsResult {
  success: boolean;
  message: string;
  response: any;
}

interface PhoneNormalization {
  valid: boolean;
  phone: string;
  error: string | null;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly balanceUrl: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('SMS_API_URL', 'https://devcodesms.com/developpeur/Send_sms_dev');
    this.apiKey = this.configService.get<string>('SMS_API_KEY', 'GuESKhMezKLPNkYUII01TXZQR3pHSlQ1eEdRS015dVpSZmlXcGFJejZMc2h5aExBSGRnbHNwMXBhRFE9');
    this.sender = this.configService.get<string>('SMS_SENDER', 'KIAMA S.A');
    this.balanceUrl = this.configService.get<string>('SMS_BALANCE_URL', 'https://devcodesms.com/developpeur/Solde_sms_dev');
  }

  /**
   * Envoie un SMS à un seul destinataire
   */
  async sendSms(phone: string, message: string, normalize: boolean = true): Promise<SmsResult> {
    try {
      // Vérification de la configuration
      if (!this.isConfigured()) {
        return {
          success: false,
          message: 'Configuration SMS manquante (API_KEY, API_URL ou SENDER)',
          response: null,
        };
      }

      // Normalisation du numéro si demandé
      if (normalize) {
        const normalizedPhone = this.normalizePhoneNumber(phone);
        if (!normalizedPhone.valid) {
          return {
            success: false,
            message: 'Numéro invalide: ' + normalizedPhone.error,
            response: null,
          };
        }
        phone = normalizedPhone.phone;
      }

      // Validation du message
      if (!message || message.trim().length === 0) {
        return {
          success: false,
          message: 'Le message ne peut pas être vide',
          response: null,
        };
      }

      // Limitation à 160 caractères (standard SMS)
      if (message.length > 160) {
        message = message.substring(0, 160);
        this.logger.warn(`Message SMS tronqué à 160 caractères pour ${phone}`);
      }

      // Envoi du SMS
      const result = await this.sendSingleSms(phone, message);

      if (result.success) {
        this.logger.log(`SMS envoyé avec succès à ${phone}`);
      } else {
        this.logger.error(`Échec envoi SMS à ${phone}: ${result.message}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Exception lors de l'envoi SMS à ${phone}:`, error);
      return {
        success: false,
        message: 'Erreur technique: ' + error.message,
        response: null,
      };
    }
  }

  /**
   * Envoie des SMS à plusieurs destinataires
   */
  async sendBulkSms(
    recipients: Array<{ phone: string; message: string }>,
    stopOnError: boolean = false,
    normalize: boolean = true,
  ): Promise<{
    total: number;
    success_count: number;
    failed_count: number;
    details: any[];
  }> {
    const results = {
      total: recipients.length,
      success_count: 0,
      failed_count: 0,
      details: [] as any[],
    };

    for (let index = 0; index < recipients.length; index++) {
      const recipient = recipients[index];

      // Validation des données
      if (!recipient.phone || !recipient.message) {
        results.failed_count++;
        results.details[index] = {
          phone: recipient.phone || 'N/A',
          success: false,
          message: 'Téléphone ou message manquant',
          response: null,
        };
        continue;
      }

      // Envoi du SMS
      const result = await this.sendSms(recipient.phone, recipient.message, normalize);
      results.details[index] = {
        ...result,
        phone: recipient.phone,
      };

      if (result.success) {
        results.success_count++;
      } else {
        results.failed_count++;
        if (stopOnError) {
          this.logger.log(`Arrêt de l'envoi en lot suite à un échec à l'index ${index}`);
          break;
        }
      }

      // Petit délai pour éviter le spam (100ms)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log(
      `Envoi en lot terminé: ${results.success_count}/${results.total} réussis`,
    );

    return results;
  }

  /**
   * Envoie un SMS simple avec le même message à plusieurs numéros
   */
  async sendSameSmsToMultiple(
    phones: string[],
    message: string,
    stopOnError: boolean = false,
    normalize: boolean = true,
  ): Promise<any> {
    const recipients = phones.map((phone) => ({ phone, message }));
    return this.sendBulkSms(recipients, stopOnError, normalize);
  }

  /**
   * Normalise un numéro de téléphone camerounais
   * Formats acceptés: 6XXXXXXXX, 237XXXXXXXX, +237XXXXXXXX, 00237XXXXXXXX
   */
  normalizePhoneNumber(phone: string): PhoneNormalization {
    // Nettoyage du numéro
    phone = phone.replace(/[\s\-\.]/g, '');
    phone = phone.replace(/[^\d+]/g, '');

    if (!phone || phone.length === 0) {
      return {
        valid: false,
        phone: '',
        error: 'Numéro vide après nettoyage',
      };
    }

    // Format local camerounais (6XXXXXXXX)
    if (/^6[0-9]{8}$/.test(phone)) {
      return {
        valid: true,
        phone: '+237' + phone,
        error: null,
      };
    }

    // Format avec indicatif sans + (2376XXXXXXXX)
    if (/^2376[0-9]{8}$/.test(phone)) {
      return {
        valid: true,
        phone: '+' + phone,
        error: null,
      };
    }

    // Format international avec + (+2376XXXXXXXX)
    if (/^\+2376[0-9]{8}$/.test(phone)) {
      return {
        valid: true,
        phone: phone,
        error: null,
      };
    }

    // Format international avec 00 (002376XXXXXXXX)
    if (/^002376[0-9]{8}$/.test(phone)) {
      return {
        valid: true,
        phone: '+' + phone.substring(2),
        error: null,
      };
    }

    return {
      valid: false,
      phone: phone,
      error: 'Format non reconnu. Utilisez: 6XXXXXXXX, 2376XXXXXXXX, +2376XXXXXXXX',
    };
  }

  /**
   * Envoie effectif d'un SMS via HTTP POST
   */
  private async sendSingleSms(phone: string, message: string): Promise<SmsResult> {
    try {
      const data = new URLSearchParams({
        api_key: this.apiKey,
        sender: this.sender,
        phone: phone,
        message: message,
      });

      const response = await axios.post(this.apiUrl, data.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'KIAMA-SMS-Service/1.0',
        },
        timeout: 30000,
      });

      if (response.status === 200) {
        return {
          success: true,
          message: 'SMS envoyé avec succès',
          response: response.data,
        };
      } else {
        return {
          success: false,
          message: `Code HTTP: ${response.status}`,
          response: response.data,
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: `Erreur HTTP: ${error.message}`,
          response: error.response?.data || null,
        };
      }
      throw error;
    }
  }

  /**
   * Vérifie si la configuration SMS est complète
   */
  isConfigured(): boolean {
    return !!this.apiUrl && !!this.apiKey && !!this.sender;
  }

  /**
   * Test de connectivité avec l'API SMS
   */
  async testConnection(): Promise<SmsResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Configuration SMS incomplète',
        response: null,
      };
    }

    try {
      const result = await this.sendSingleSms('+2376050327091', 'Test KIAMA');
      return {
        success: true,
        message: 'Test de connectivité réussi',
        response: result.response,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur de connectivité: ' + error.message,
        response: null,
      };
    }
  }

  /**
   * Récupère le solde de SMS restants
   */
  async getSmsBalance(): Promise<{
    success: boolean;
    balance: number | null;
    qty_acheter?: number | null;
    qty_envoye?: number | null;
    message: string;
    response: any;
    error_type?: string;
    http_code?: number;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        balance: null,
        message: 'Configuration SMS manquante (API_KEY, API_URL ou SENDER)',
        response: null,
        error_type: 'configuration',
      };
    }

    try {
      const data = new URLSearchParams({
        api_key: this.apiKey,
      });

      const response = await axios.post(this.balanceUrl, data.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'KIAMA-SMS-Service/1.0',
          Accept: 'application/json',
        },
        timeout: 30000,
      });

      if (response.status === 406) {
        return {
          success: false,
          balance: null,
          message: 'L\'endpoint pour consulter le solde SMS n\'est pas disponible.',
          response: response.data,
          error_type: 'endpoint_unavailable',
          http_code: 406,
        };
      }

      if (response.status !== 200) {
        return {
          success: false,
          balance: null,
          message: 'Erreur HTTP lors de la récupération du solde',
          response: response.data,
          error_type: 'http_error',
          http_code: response.status,
        };
      }

      const decoded = response.data;
      const dataBlock = decoded?.data;

      if (decoded?.success === false) {
        return {
          success: false,
          balance: null,
          message: decoded?.msg || decoded?.message || 'Erreur API',
          response: decoded,
          error_type: 'api_error',
        };
      }

      if (dataBlock && typeof dataBlock.solde !== 'undefined') {
        return {
          success: true,
          balance: Number(dataBlock.solde),
          qty_acheter: typeof dataBlock.qty_acheter !== 'undefined' ? Number(dataBlock.qty_acheter) : null,
          qty_envoye: typeof dataBlock.qty_envoye !== 'undefined' ? Number(dataBlock.qty_envoye) : null,
          message: decoded?.msg || 'Solde récupéré avec succès',
          response: decoded,
        };
      }

      const fallbackBalance = decoded?.solde ?? decoded?.balance;
      if (typeof fallbackBalance !== 'undefined') {
        return {
          success: true,
          balance: Number(fallbackBalance),
          qty_acheter: null,
          qty_envoye: null,
          message: 'Solde récupéré avec succès',
          response: decoded,
        };
      }

      return {
        success: false,
        balance: null,
        message: 'Format de réponse non reconnu',
        response: decoded,
        error_type: 'format_unknown',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          balance: null,
          message: 'Erreur HTTP: ' + error.message,
          response: error.response?.data || null,
          error_type: 'http_error',
          http_code: error.response?.status,
        };
      }

      return {
        success: false,
        balance: null,
        message: 'Erreur technique: ' + (error as Error).message,
        response: null,
        error_type: 'exception',
      };
    }
  }

  // Getters pour debug
  getApiUrl(): string {
    return this.apiUrl;
  }

  getSender(): string {
    return this.sender;
  }

  getApiKey(): string {
    return this.apiKey.substring(0, 10) + '...'; // Masqué pour sécurité
  }
}
