// src/auth/auth.service.ts

import * as bcrypt from 'bcryptjs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {
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

  // 🔐 API 1: Connexion et génération des tokens
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 1️⃣ Vérifier si l'utilisateur existe
    const user = await this.prismaService.user.findUnique({
      where: { username },
      include: {
        role: {
          select: {
            id: true,
            nom: true,
            description: true,
          },
        },
        service: {
          select: {
            id: true,
            nom: true,
            sigle: true,
            type: true,
          },
        },
        correspondant: {
          select: {
            id: true,
            nom: true,
            adresse: true,
            telephone: true,
            email: true,
            type: true,
            civilite: true,
            matricule: true,
            isDelete: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        servicesAdditionnels: {
          select: {
            id: true,
            createdAt: true,
            service: {
              select: {
                id: true,
                nom: true,
                sigle: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Nom d\'utilisateur ou mot de passe incorrect.');
    }

    // 2️⃣ Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Nom d\'utilisateur ou mot de passe incorrect.');
    }

    // 3️⃣ Générer le payload pour les tokens
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
      idRole: user.idRole,
    };

    // 4️⃣ Générer le token d'accès (expire dans 24 heures)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    // 5️⃣ Générer le refresh token (expire dans 7 jours)
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    // 6️⃣ Calculer les dates d'expiration
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24); // 24 heures

    const refreshExpiration = new Date();
    refreshExpiration.setDate(refreshExpiration.getDate() + 7); // 7 jours

    // 7️⃣ Mettre à jour l'utilisateur avec les tokens
    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        token: accessToken,
        expiresToken: tokenExpiration,
        refreshToken: refreshToken,
        refreshExpires: refreshExpiration,
        verifyOtp: null,
        verifyExpires: null,
      },
      include: {
        role: {
          select: {
            id: true,
            nom: true,
            description: true,
          },
        },
        service: {
          select: {
            id: true,
            nom: true,
            sigle: true,
            type: true,
          },
        },
        correspondant: {
          select: {
            id: true,
            nom: true,
            adresse: true,
            telephone: true,
            email: true,
            type: true,
            civilite: true,
            matricule: true,
            isDelete: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        servicesAdditionnels: {
          select: {
            id: true,
            createdAt: true,
            service: {
              select: {
                id: true,
                nom: true,
                sigle: true,
                type: true,
              },
            },
          },
        },
      },
    });

    // 8️⃣ Retourner les tokens et les informations de l'utilisateur
    const { password: _, verifyOtp: __, verifyExpires: ___, resetOtp: ____, resetExpires: _____, ...userWithoutSensitiveData } = updatedUser;

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
        expiresIn: '24 hours',
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
        username: user.username,
        idRole: user.idRole,
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
