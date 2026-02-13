// src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

const jwtPublicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtPublicKey || process.env.JWT_SECRET || 'patnuc-segmentation-secret-key-2025',
    });
  }

  async validate(payload: any) {
    // Vérifier si l'utilisateur existe toujours
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        code: 'failure',
        title: 'UnauthorizedException',
        message: 'Token invalide. Utilisateur introuvable.',
        data: [],
      });
    }

    // Retourner les informations de l'utilisateur
    return {
      id: payload.id,
      email: payload.email,
      nom: payload.nom,
      role: payload.role,
    };
  }
}
