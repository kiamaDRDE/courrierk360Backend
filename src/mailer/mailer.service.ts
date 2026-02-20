import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

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
      // Logs détaillés pour debug en production
      logger: true,
      debug: process.env.NODE_ENV !== 'production',
    });

    // Vérifier la connexion SMTP au démarrage
    this.verifyConnection();
  }

  /**
   * Vérifier la connexion SMTP
   */
  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('🟢 Connexion SMTP vérifiée avec succès');
    } catch (error) {
      this.logger.error('🔴 Erreur de connexion SMTP:', error);
    }
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

  /**
   * Envoie un email d'accusé de réception au correspondant
   */
  async sendCourrierAccuseReception(
    email: string,
    civilite: string,
    nom: string,
    numero: string,
    reference: string,
    objet: string,
    dateEnregistrement: string,
    serviceNom: string,
  ): Promise<boolean> {
    try {
      this.logger.log(`🚀 Préparation email accusé de réception pour ${email}`);
      
      // Lire le template HTML
      const templatePath = path.join(__dirname, 'templates', 'courrier-accuse-reception.html');
      let htmlContent = fs.readFileSync(templatePath, 'utf8');

      // Remplacer les placeholders
      htmlContent = htmlContent
        .replace(/{{civilite}}/g, civilite || '')
        .replace(/{{nom}}/g, nom || 'Monsieur/Madame')
        .replace(/{{numero}}/g, numero)
        .replace(/{{reference}}/g, reference)
        .replace(/{{objet}}/g, objet || 'N/A')
        .replace(/{{dateEnregistrement}}/g, dateEnregistrement)
        .replace(/{{serviceNom}}/g, serviceNom || 'Service compétent');

      const mailOptions = {
        from: {
          name: 'KIAMA S.A. - Gestion du Courrier',
          address: 'ppatnuc@gmail.com',
        },
        to: email,
        subject: '✅ Accusé de Réception - Votre courrier a été enregistré',
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(process.cwd(), 'public', 'logo.png'),
            cid: 'logo', // Content-ID pour référencer dans le HTML avec src="cid:logo"
          },
        ],
      };

      this.logger.log(`📧 Tentative d'envoi email à: ${email}`);
      this.logger.log(`📋 Configuration SMTP: service=gmail, user=ppatnuc@gmail.com`);
      
      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`✅ Email accusé de réception RÉELLEMENT envoyé à ${email} pour le courrier ${numero}`);
      this.logger.log(`📨 MessageId: ${info.messageId}`);
      this.logger.log(`📤 Réponse serveur: ${info.response || 'N/A'}`);
      this.logger.log(`✉️ Accepted: ${JSON.stringify(info.accepted || [])}`);
      this.logger.log(`❌ Rejected: ${JSON.stringify(info.rejected || [])}`);
      
      return true;
    } catch (error) {
      this.logger.error(`🔴 ERREUR DÉTAILLÉE lors de l'envoi de l'accusé de réception à ${email}:`);
      this.logger.error(`🚫 Erreur complète:`, error);
      this.logger.error(`🎯 Code erreur: ${error.code || 'N/A'}`);
      this.logger.error(`⚡ Message: ${error.message || 'N/A'}`);
      
      if (error.response) {
        this.logger.error(`📧 Réponse serveur: ${error.response}`);
      }
      
      return false;
    }
  }

  /**
   * Envoie un email de notification au service destinataire
   */
  async sendCourrierNotificationService(
    userEmail: string,
    userFirstName: string,
    userLastName: string,
    serviceNom: string,
    courrier: {
      numero: string;
      reference: string;
      objet: string;
      civilite: string;
      nom: string;
      priorite: string;
      categorie: string;
      dateArrivee: string;
      commentaire?: string;
    },
  ): Promise<boolean> {
    try {
      this.logger.log(`🚀 Préparation email notification service pour ${userEmail}`);
      
      // Lire le template HTML
      const templatePath = path.join(__dirname, 'templates', 'courrier-notification-service.html');
      let htmlContent = fs.readFileSync(templatePath, 'utf8');

      // Déterminer l'icône de priorité
      let prioriteIcon = '🟡';
      const prioriteLower = (courrier.priorite || 'Normal').toLowerCase();
      if (prioriteLower.includes('urgent') || prioriteLower.includes('haute')) {
        prioriteIcon = '🔴';
      } else if (prioriteLower.includes('basse')) {
        prioriteIcon = '🟢';
      }

      // Remplacer les placeholders
      htmlContent = htmlContent
        .replace(/{{userFirstName}}/g, userFirstName || '')
        .replace(/{{userLastName}}/g, userLastName || '')
        .replace(/{{serviceNom}}/g, serviceNom)
        .replace(/{{numero}}/g, courrier.numero)
        .replace(/{{reference}}/g, courrier.reference)
        .replace(/{{objet}}/g, courrier.objet || 'N/A')
        .replace(/{{civilite}}/g, courrier.civilite || '')
        .replace(/{{nom}}/g, courrier.nom || 'Inconnu')
        .replace(/{{priorite}}/g, courrier.priorite)
        .replace(/{{prioriteLower}}/g, prioriteLower)
        .replace(/{{prioriteIcon}}/g, prioriteIcon)
        .replace(/{{categorie}}/g, courrier.categorie || 'N/A')
        .replace(/{{dateArrivee}}/g, courrier.dateArrivee)
        .replace(/{{commentaire}}/g, courrier.commentaire || '');

      // Gérer les blocs conditionnels simples
      if (!courrier.commentaire) {
        htmlContent = htmlContent.replace(/{{#if commentaire}}[\s\S]*?{{\/if}}/g, '');
      } else {
        htmlContent = htmlContent.replace(/{{#if commentaire}}/g, '').replace(/{{\/if}}/g, '');
      }

      const mailOptions = {
        from: {
          name: 'KIAMA S.A. - Gestion du Courrier',
          address: 'ppatnuc@gmail.com',
        },
        to: userEmail,
        subject: `📥 Nouveau Courrier - ${courrier.numero} - ${serviceNom}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(process.cwd(), 'public', 'logo.png'),
            cid: 'logo', // Content-ID pour référencer dans le HTML avec src="cid:logo"
          },
        ],
      };

      this.logger.log(`📧 Tentative d'envoi email de notification service à: ${userEmail}`);
      
      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`✅ Email notification service RÉELLEMENT envoyé à ${userEmail} pour le courrier ${courrier.numero}`);
      this.logger.log(`📨 MessageId: ${info.messageId}`);
      this.logger.log(`📤 Réponse serveur: ${info.response || 'N/A'}`);
      this.logger.log(`✉️ Accepted: ${JSON.stringify(info.accepted || [])}`);
      this.logger.log(`❌ Rejected: ${JSON.stringify(info.rejected || [])}`);
      
      return true;
    } catch (error) {
      this.logger.error(`🔴 ERREUR DÉTAILLÉE lors de l'envoi de la notification au service ${userEmail}:`);
      this.logger.error(`🚫 Erreur complète:`, error);
      this.logger.error(`🎯 Code erreur: ${error.code || 'N/A'}`);
      this.logger.error(`⚡ Message: ${error.message || 'N/A'}`);
      
      if (error.response) {
        this.logger.error(`📧 Réponse serveur: ${error.response}`);
      }
      
      return false;
    }
  }

  /**
   * Envoie un email de notification pour une transmission en copie
   */
  async sendCourrierNotificationCopieService(
    userEmail: string,
    userFirstName: string,
    userLastName: string,
    serviceNom: string,
    courrier: {
      numero: string;
      reference: string;
      objet: string;
      civilite: string;
      nom: string;
      priorite: string;
      categorie: string;
      dateArrivee: string;
      commentaire?: string;
    },
  ): Promise<boolean> {
    try {
      const templatePath = path.join(__dirname, 'templates', 'courrier-notification-copie.html');
      let htmlContent = fs.readFileSync(templatePath, 'utf8');

      htmlContent = htmlContent
        .replace(/{{userFirstName}}/g, userFirstName || '')
        .replace(/{{userLastName}}/g, userLastName || '')
        .replace(/{{serviceNom}}/g, serviceNom)
        .replace(/{{numero}}/g, courrier.numero)
        .replace(/{{reference}}/g, courrier.reference)
        .replace(/{{objet}}/g, courrier.objet || 'N/A')
        .replace(/{{civilite}}/g, courrier.civilite || '')
        .replace(/{{nom}}/g, courrier.nom || 'Inconnu')
        .replace(/{{priorite}}/g, courrier.priorite)
        .replace(/{{categorie}}/g, courrier.categorie || 'N/A')
        .replace(/{{dateArrivee}}/g, courrier.dateArrivee)
        .replace(/{{commentaire}}/g, courrier.commentaire || '');

      if (!courrier.commentaire) {
        htmlContent = htmlContent.replace(/{{#if commentaire}}[\s\S]*?{{\/if}}/g, '');
      } else {
        htmlContent = htmlContent.replace(/{{#if commentaire}}/g, '').replace(/{{\/if}}/g, '');
      }

      const mailOptions = {
        from: {
          name: 'KIAMA S.A. - Gestion du Courrier',
          address: 'ppatnuc@gmail.com',
        },
        to: userEmail,
        subject: `📎 Transmission en copie - ${courrier.numero} - ${serviceNom}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(process.cwd(), 'public', 'logo.png'),
            cid: 'logo',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email notification copie envoyé à ${userEmail} pour le courrier ${courrier.numero}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi de la notification copie à ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Envoie un email de notification pour un courrier interne
   */
  async sendCourrierInterneNotification(
    userEmail: string,
    userFirstName: string,
    userLastName: string,
    serviceNom: string,
    courrier: {
      objet?: string | null;
      classeCourrier?: string | null;
      typeTransmission?: string | null;
      commentaire?: string | null;
      dateCreation?: string;
    },
  ): Promise<boolean> {
    try {
      const templatePath = path.join(__dirname, 'templates', 'courrier-interne-notification.html');
      let htmlContent = fs.readFileSync(templatePath, 'utf8');

      htmlContent = htmlContent
        .replace(/{{userFirstName}}/g, userFirstName || '')
        .replace(/{{userLastName}}/g, userLastName || '')
        .replace(/{{serviceNom}}/g, serviceNom || 'Service')
        .replace(/{{objet}}/g, courrier.objet || 'N/A')
        .replace(/{{classeCourrier}}/g, courrier.classeCourrier || 'N/A')
        .replace(/{{typeTransmission}}/g, courrier.typeTransmission || 'N/A')
        .replace(/{{commentaire}}/g, courrier.commentaire || '')
        .replace(/{{dateCreation}}/g, courrier.dateCreation || '');

      const mailOptions = {
        from: {
          name: 'KIAMA S.A. - Gestion du Courrier',
          address: 'ppatnuc@gmail.com',
        },
        to: userEmail,
        subject: `📄 Courrier interne - ${serviceNom}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(process.cwd(), 'public', 'logo.png'),
            cid: 'logo',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email courrier interne envoyé à ${userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi email courrier interne à ${userEmail}:`, error);
      return false;
    }
  }

  /**
   * Envoie un email de notification pour un courrier départ
   */
  async sendCourrierDepartNotification(
    destinataireEmail: string,
    destinataireNom: string,
    courrierDepart: {
      numeroReference?: string | null;
      numeroActe?: string | null;
      typeCourrier?: string | null;
      categorie?: string | null;
      classeCourrier?: string | null;
      dateSignature?: Date | null;
      signataire?: string | null;
      commentaire?: string | null;
    },
  ): Promise<boolean> {
    try {
      const templatePath = path.join(__dirname, 'templates', 'courrier-depart-notification.html');
      let htmlContent = fs.readFileSync(templatePath, 'utf8');

      // Formater la date de signature
      const dateSignature = courrierDepart.dateSignature
        ? new Date(courrierDepart.dateSignature).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : 'N/A';

      // Gérer le bloc commentaire
      let commentaireBlock = '';
      if (courrierDepart.commentaire) {
        commentaireBlock = `
                <div class="info-item">
                    <span class="info-label">Commentaire :</span>
                    <span class="info-value">${courrierDepart.commentaire}</span>
                </div>`;
      }

      // Remplacer les placeholders
      htmlContent = htmlContent
        .replace(/{{destinataire}}/g, destinataireNom || 'Monsieur/Madame')
        .replace(/{{numeroReference}}/g, courrierDepart.numeroReference || 'N/A')
        .replace(/{{numeroActe}}/g, courrierDepart.numeroActe || 'N/A')
        .replace(/{{typeCourrier}}/g, courrierDepart.typeCourrier || 'N/A')
        .replace(/{{categorie}}/g, courrierDepart.categorie || 'N/A')
        .replace(/{{classeCourrier}}/g, courrierDepart.classeCourrier || 'N/A')
        .replace(/{{dateSignature}}/g, dateSignature)
        .replace(/{{signataire}}/g, courrierDepart.signataire || 'N/A')
        .replace(/{{commentaireBlock}}/g, commentaireBlock);

      const mailOptions = {
        from: {
          name: 'KIAMA S.A. - Gestion du Courrier',
          address: 'ppatnuc@gmail.com',
        },
        to: destinataireEmail,
        subject: `📤 Courrier Départ - ${courrierDepart.numeroReference || 'Notification'}`,
        html: htmlContent,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(process.cwd(), 'public', 'logo.png'),
            cid: 'logo',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email courrier départ envoyé à ${destinataireEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Erreur lors de l'envoi email courrier départ à ${destinataireEmail}:`, error);
      return false;
    }
  }
}
