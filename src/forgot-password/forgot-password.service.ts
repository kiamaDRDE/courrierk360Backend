// src/forgot-password/forgot-password.service.ts

import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RequestResetDto } from './dto/request-reset.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class ForgotPasswordService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    // Configuration du transporteur d'email
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kiamadrde@gmail.com',
        pass: 'jyqkjhovvrdmujrs',
      },
    });
  }

  // Fonction utilitaire pour formater les réponses
  private formatResponse(data: any, title: string, message: string) {
    return {
      success: true,
      statusCode: 201,
      code: 'success',
      title,
      message,
      data,
    };
  }

  // Générer un code OTP à 6 chiffres
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Envoyer un email avec le code OTP de réinitialisation
  private async sendResetOtpEmail(email: string, otp: string, nom: string) {
    const mailOptions = {
      from: 'kiamadrde@gmail.com',
      to: email,
      subject: 'Réinitialisation de mot de passe - Patnuc Segmentation',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
          <p>Bonjour <strong>${nom}</strong>,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Voici votre code de vérification :</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">Ce code expirera dans <strong>5 minutes</strong>.</p>
          <p style="color: #666;">Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} Patnuc Segmentation. Tous droits réservés.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      // Ne pas bloquer le processus si l'email échoue
    }
  }

  // 🔐 API 1: Demande de réinitialisation de mot de passe (génère OTP)
  async requestReset(requestResetDto: RequestResetDto) {
    const { email } = requestResetDto;

    // 1️⃣ Vérifier si l'utilisateur existe
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Aucun compte associé à cet email.');
    }

    // 2️⃣ Générer un code OTP
    const otp = this.generateOtp();
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 5); // Expire dans 5 minutes

    // 3️⃣ Stocker l'OTP dans la base de données
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetExpires: otpExpiration,
      },
    });

    // 4️⃣ Envoyer l'OTP par email de manière asynchrone
    this.sendResetOtpEmail(email, otp, user.username).catch(err => 
      console.error('Erreur envoi email:', err)
    );

    // 5️⃣ Retourner la réponse avec l'OTP
    return this.formatResponse(
      {
        email: user.email,
        otp: otp, // Pour les tests, on retourne l'OTP dans la réponse
        expiresAt: otpExpiration,
        expiresIn: '5 minutes',
      },
      'Demande de réinitialisation',
      'Un code OTP a été généré et envoyé à votre adresse email.',
    );
  }

  // 🔐 API 2: Vérification de l'OTP et génération d'un token temporaire
  async verifyResetOtp(verifyResetOtpDto: VerifyResetOtpDto) {
    const { email, otp } = verifyResetOtpDto;

    // 1️⃣ Vérifier si l'utilisateur existe
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }

    // 2️⃣ Vérifier si l'OTP existe
    if (!user.resetOtp) {
      throw new BadRequestException('Aucun code OTP trouvé. Veuillez d\'abord demander une réinitialisation.');
    }

    // 3️⃣ Vérifier si l'OTP est correct
    if (user.resetOtp !== otp) {
      throw new UnauthorizedException('Code OTP incorrect.');
    }

    // 4️⃣ Vérifier si l'OTP n'a pas expiré
    if (user.resetExpires && user.resetExpires < new Date()) {
      throw new UnauthorizedException('Le code OTP a expiré. Veuillez demander un nouveau code.');
    }

    // 5️⃣ Générer un token temporaire pour la réinitialisation (expire dans 10 minutes)
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'password-reset', // Type spécial pour identifier ce token
    };

    const resetToken = this.jwtService.sign(payload, {
      expiresIn: '10m', // Token valide 10 minutes
    });

    const tokenExpiration = new Date();
    tokenExpiration.setMinutes(tokenExpiration.getMinutes() + 10);

    // 6️⃣ Retourner le token temporaire
    return this.formatResponse(
      {
        resetToken,
        expiresAt: tokenExpiration,
        expiresIn: '10 minutes',
      },
      'OTP vérifié',
      'Code OTP vérifié avec succès. Utilisez le token pour réinitialiser votre mot de passe.',
    );
  }

  // 🔐 API 3: Réinitialisation du mot de passe avec token
  async resetPassword(resetToken: string, resetPasswordDto: ResetPasswordDto) {
    const { password, confirmPassword } = resetPasswordDto;

    // 1️⃣ Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas.');
    }

    try {
      // 2️⃣ Vérifier et décoder le token
      const decoded = this.jwtService.verify(resetToken);

      // 3️⃣ Vérifier que c'est bien un token de réinitialisation
      if (decoded.type !== 'password-reset') {
        throw new UnauthorizedException('Token invalide. Utilisez un token de réinitialisation de mot de passe.');
      }

      // 4️⃣ Récupérer l'utilisateur
      const user = await this.prismaService.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé.');
      }

      // 5️⃣ Hacher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // 6️⃣ Générer un nouveau token d'accès et refresh token (même format que la connexion)
      const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
        idRole: user.idRole,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '1h',
      });

      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
      });

      const tokenExpiration = new Date();
      tokenExpiration.setHours(tokenExpiration.getHours() + 1);

      const refreshExpiration = new Date();
      refreshExpiration.setDate(refreshExpiration.getDate() + 7);

      // 7️⃣ Mettre à jour le mot de passe, les tokens et réinitialiser l'OTP
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          token: accessToken,
          expiresToken: tokenExpiration,
          refreshToken: refreshToken,
          refreshExpires: refreshExpiration,
          resetOtp: null, // Réinitialiser l'OTP après utilisation
          resetExpires: null,
        },
      });

      // 8️⃣ Retourner les tokens et les informations de l'utilisateur
      const { password: _, resetOtp: __, resetExpires: ___, ...userWithoutSensitiveData } = user;

      return this.formatResponse(
        {
          user: {
            ...userWithoutSensitiveData,
            token: accessToken,
            expiresToken: tokenExpiration,
            refreshToken: refreshToken,
            refreshExpires: refreshExpiration,
          },
          accessToken,
          refreshToken,
          expiresIn: '1 hour',
        },
        'Mot de passe réinitialisé',
        'Votre mot de passe a été modifié avec succès. Vous êtes maintenant connecté.',
      );
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Token invalide ou expiré.');
    }
  }
}
