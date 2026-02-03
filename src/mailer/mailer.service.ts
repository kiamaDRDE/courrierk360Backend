import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configuration du transporteur d'email
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ppatnuc@gmail.com',
        pass: 'jyqkjhovvrdmujrs',
      },
    });
  }

  /**
   * Envoie un email de bienvenue après création de compte
   */
  async sendWelcomeEmail(email: string, nom: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: 'KIAMA RegTar',
          address: 'ppatnuc@gmail.com',
        },
        to: email,
        subject: '🎉 Bienvenue sur KIAMA RegTar - Votre compte a été créé !',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenue sur KIAMA RegTar</title>
            <style>
              body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
              }
              .content {
                padding: 40px 30px;
              }
              .welcome-message {
                font-size: 18px;
                margin-bottom: 20px;
                color: #2c3e50;
              }
              .platform-info {
                background-color: #f8f9fa;
                padding: 25px;
                border-radius: 8px;
                margin: 25px 0;
                border-left: 4px solid #667eea;
              }
              .platform-info h3 {
                color: #667eea;
                margin-top: 0;
                margin-bottom: 15px;
              }
              .features {
                list-style: none;
                padding: 0;
                margin: 20px 0;
              }
              .features li {
                padding: 8px 0;
                border-bottom: 1px solid #eee;
                position: relative;
                padding-left: 25px;
              }
              .features li:before {
                content: '✓';
                color: #28a745;
                font-weight: bold;
                position: absolute;
                left: 0;
              }
              .cta {
                text-align: center;
                margin: 30px 0;
              }
              .cta a {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                transition: transform 0.3s ease;
              }
              .cta a:hover {
                transform: translateY(-2px);
              }
              .footer {
                background-color: #2c3e50;
                color: white;
                text-align: center;
                padding: 20px;
                font-size: 14px;
              }
              .footer a {
                color: #667eea;
                text-decoration: none;
              }
              .emoji {
                font-size: 24px;
                margin: 0 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1><span class="emoji">🎉</span> KIAMA RegTar <span class="emoji">🎉</span></h1>
                <p>Plateforme de Régulation Tarifaire</p>
              </div>
              
              <div class="content">
                <div class="welcome-message">
                  <h2>Bonjour <strong>${nom}</strong>,</h2>
                  <p>Félicitations ! Votre compte a été créé avec succès sur la plateforme <strong>KIAMA RegTar</strong>.</p>
                </div>

                <div class="platform-info">
                  <h3><span class="emoji">🚀</span> À propos de KIAMA RegTar</h3>
                  <p>KIAMA RegTar est votre plateforme de régulation tarifaire qui vous permet de :</p>
                  
                  <ul class="features">
                    <li>Gérer les opérateurs de télécommunications</li>
                    <li>Analyser les structures tarifaires</li>
                    <li>Calculer les effets club</li>
                    <li>Suivre les tarifs d'interconnexion</li>
                    <li>Générer des rapports détaillés</li>
                    <li>Accéder aux données en temps réel</li>
                  </ul>
                </div>

                <div class="cta">
                  <p><strong>Votre compte est maintenant actif et prêt à être utilisé !</strong></p>
                  <p>Connectez-vous dès maintenant pour découvrir toutes les fonctionnalités.</p>
                </div>

                <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #28a745; margin-top: 0;">📧 Informations de connexion</h4>
                  <p><strong>Email :</strong> ${email}</p>
                  <p><strong>Plateforme :</strong> KIAMA RegTar</p>
                  <p style="margin-bottom: 0;"><em>Utilisez ces informations pour vous connecter à votre compte.</em></p>
                </div>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  <strong>Besoin d'aide ?</strong><br>
                  Notre équipe support est à votre disposition pour vous accompagner dans la prise en main de la plateforme.
                </p>
              </div>

              <div class="footer">
                <p><strong>KIAMA RegTar</strong> - Plateforme de Régulation Tarifaire</p>
                <p style="margin: 5px 0;">
                  Email: <a href="mailto:ppatnuc@gmail.com">ppatnuc@gmail.com</a>
                </p>
                <p style="margin-top: 15px; font-size: 12px; color: #95a5a6;">
                  Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de bienvenue envoyé avec succès à ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email de bienvenue à ${email}:`, error);
      return false;
    }
  }

  /**
   * Envoie un email avec le code OTP pour la connexion
   */
  async sendOtpEmail(email: string, otp: string, nom: string): Promise<boolean> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🔐 Code de vérification</h1>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #333; margin-top: 0;">Bonjour <strong>${nom}</strong>,</h2>
              <p style="font-size: 16px; color: #555;">Votre code de vérification pour vous connecter à <strong>KIAMA RegTar</strong> est :</p>
              
              <div style="background-color: #f8f9fa; padding: 25px; text-align: center; border-radius: 8px; margin: 30px 0; border: 2px dashed #667eea;">
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea;">
                  ${otp}
                </div>
              </div>
              
              <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">
                  ⏱️ <strong>Ce code expirera dans 5 minutes</strong>
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Si vous n'avez pas demandé ce code, veuillez ignorer cet email et assurez-vous que votre compte est sécurisé.
              </p>
            </div>
            
            <div style="background-color: #2c3e50; color: white; text-align: center; padding: 20px; font-size: 14px;">
              <p style="margin: 0;"><strong>KIAMA RegTar</strong> - Plateforme de Régulation Tarifaire</p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #95a5a6;">
                © ${new Date().getFullYear()} Tous droits réservés.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: {
          name: 'KIAMA RegTar',
          address: 'ppatnuc@gmail.com',
        },
        to: email,
        subject: '🔐 Code de vérification - KIAMA RegTar',
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Code OTP envoyé avec succès à ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi du code OTP à ${email}:`, error);
      this.logger.error('Détails de l\'erreur:', error.message);
      return false;
    }
  }

  /**
   * Envoie un email générique
   */
  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: 'KIAMA RegTar',
          address: 'ppatnuc@gmail.com',
        },
        to,
        subject,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email envoyé avec succès à ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de l'email à ${to}:`, error);
      return false;
    }
  }
}
