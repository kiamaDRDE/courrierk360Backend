// src/auth/auth.service.ts

import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    // Configuration du transporteur d'email
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'ppatnuc@gmail.com',
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

  // Envoyer un email avec le code OTP
  private async sendOtpEmail(email: string, otp: string, nom: string) {
    console.log('📧 Tentative d\'envoi d\'email OTP à:', email);
    
    const mailOptions = {
      from: 'ppatnuc@gmail.com',
      to: email,
      subject: 'Code de vérification - Patnuc Segmentation',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Code de vérification</h2>
          <p>Bonjour <strong>${nom}</strong>,</p>
          <p>Votre code de vérification pour vous connecter à Patnuc Segmentation est :</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666;">Ce code expirera dans <strong>5 minutes</strong>.</p>
          <p style="color: #666;">Si vous n'avez pas demandé ce code, veuillez ignorer cet email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} Patnuc Segmentation. Tous droits réservés.</p>
        </div>
      `,
    };

    try {
      console.log('📤 Configuration transporter:', {
        service: 'gmail',
        user: 'ppatnuc@gmail.com',
        hasPassword: !!this.transporter,
      });
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email OTP envoyé avec succès:', info.messageId);
      console.log('📊 Détails:', info);
    } catch (error) {
      console.error('❌ ERREUR COMPLÈTE lors de l\'envoi de l\'email OTP:');
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      console.error('Stack:', error.stack);
      console.error('Détails complets:', JSON.stringify(error, null, 2));
      // Ne pas bloquer le processus si l'email échoue
    }
  }

  // 🔐 API 1: Connexion et génération d'OTP
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1️⃣ Vérifier si l'utilisateur existe
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    // 2️⃣ Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    // 3️⃣ Générer un code OTP
    const otp = this.generateOtp();
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 5); // Expire dans 5 minutes

    // 4️⃣ Stocker l'OTP dans la base de données
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        verifyOtp: otp,
        verifyExpires: otpExpiration,
      },
    });

    // 5️⃣ Envoyer l'OTP par email de manière asynchrone
    console.log('🚀 Démarrage de l\'envoi d\'email OTP pour:', email);
    this.sendOtpEmail(email, otp, user.nom).catch(err => {
      console.error('❌ ÉCHEC d\'envoi email OTP - Erreur capturée:', err);
      console.error('Type d\'erreur:', err.constructor.name);
      console.error('Message:', err.message);
    });

    // 6️⃣ Retourner la réponse avec l'OTP
    return this.formatResponse(
      {
        email: user.email,
        otp: otp, // Pour les tests, on retourne l'OTP dans la réponse
        expiresIn: '5 minutes',
      },
      'Connexion réussie',
      'Un code OTP a été généré et envoyé à votre adresse email.',
    );
  }

  // 🔐 API 2: Vérification de l'OTP et génération des tokens
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    // 1️⃣ Vérifier si l'utilisateur existe
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email invalide.');
    }

    // 2️⃣ Vérifier si l'OTP existe
    if (!user.verifyOtp) {
      throw new BadRequestException('Aucun code OTP trouvé. Veuillez vous connecter d\'abord.');
    }

    // 3️⃣ Vérifier si l'OTP est correct
    if (user.verifyOtp !== otp) {
      throw new UnauthorizedException('Code OTP incorrect.');
    }

    // 4️⃣ Vérifier si l'OTP n'a pas expiré
    if (user.verifyExpires && user.verifyExpires < new Date()) {
      throw new UnauthorizedException('Le code OTP a expiré. Veuillez vous reconnecter.');
    }

    // 5️⃣ Générer le payload pour les tokens
    const payload = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      role: user.role,
    };

    // 6️⃣ Générer le token d'accès (expire dans 24 heures)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    // 7️⃣ Générer le refresh token (expire dans 7 jours)
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // 8️⃣ Calculer les dates d'expiration
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24); // 24 heures

    const refreshExpiration = new Date();
    refreshExpiration.setDate(refreshExpiration.getDate() + 7); // 7 jours

    // 9️⃣ Mettre à jour l'utilisateur avec les tokens et réinitialiser l'OTP
    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        token: accessToken,
        expiresToken: tokenExpiration,
        refreshToken: refreshToken,
        refreshExpires: refreshExpiration,
        verifyOtp: null, // Réinitialiser l'OTP après utilisation
        verifyExpires: null,
      },
    });

    // 🔟 Retourner les tokens et les informations de l'utilisateur
    const { password: _, verifyOtp: __, verifyExpires: ___, ...userWithoutSensitiveData } = user;

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
      'Authentification réussie',
      'Vous êtes maintenant connecté.',
    );
  }

  // 🔐 API 3: Rafraîchir le token
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // 1️⃣ Vérifier et décoder le refresh token
      const decoded = this.jwtService.verify(refreshToken);

      // 2️⃣ Récupérer l'utilisateur
      const user = await this.prismaService.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé.');
      }

      // 3️⃣ Vérifier si le refresh token correspond à celui stocké
      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Refresh token invalide.');
      }

      // 4️⃣ Vérifier si le refresh token n'a pas expiré
      if (user.refreshExpires && user.refreshExpires < new Date()) {
        throw new UnauthorizedException('Le refresh token a expiré. Veuillez vous reconnecter.');
      }

      // 5️⃣ Générer un nouveau token d'accès
      const payload = {
        id: user.id,
        email: user.email,
        nom: user.nom,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: '24h',
      });

      const tokenExpiration = new Date();
      tokenExpiration.setHours(tokenExpiration.getHours() + 24);

      // 6️⃣ Mettre à jour le token dans la base de données
      await this.prismaService.user.update({
        where: { id: user.id },
        data: {
          token: newAccessToken,
          expiresToken: tokenExpiration,
        },
      });

      // 7️⃣ Retourner le nouveau token
      return this.formatResponse(
        {
          accessToken: newAccessToken,
          expiresIn: '24 hours',
          expiresAt: tokenExpiration,
        },
        'Token rafraîchi',
        'Votre token d\'accès a été rafraîchi avec succès.',
      );
    } catch (error) {
      throw new UnauthorizedException('Refresh token invalide ou expiré.');
    }
  }
}
