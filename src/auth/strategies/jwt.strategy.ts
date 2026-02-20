// src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

// Fonction pour charger la clé publique JWT
function loadJwtPublicKey(): string {
  // 1. Essayer depuis la variable d'environnement
  const keyFromEnv = process.env.JWT_PUBLIC_KEY;
  if (keyFromEnv) {
    return keyFromEnv.replace(/\\n/g, '\n');
  }

  // 2. Essayer depuis un fichier
  const keyFilePath = process.env.JWT_PUBLIC_KEY_PATH;
  if (keyFilePath) {
    try {
      const fullPath = path.resolve(process.cwd(), keyFilePath);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf8');
      }
    } catch (error) {
      console.warn(`Impossible de lire le fichier de clé publique ${keyFilePath}:`, error);
    }
  }

  // 3. Fallback sur JWT_SECRET pour compatibilité HS256
  return process.env.JWT_SECRET || 'patnuc-segmentation-secret-key-2025';
}

const jwtPublicKey: string = loadJwtPublicKey();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtPublicKey,
      algorithms: ['RS256', 'HS256'], // Support des deux algorithmes
    });
  }

  async validate(payload: any) {
    // Support du format Symfony : { id, username, roles, iat, exp }
    // ET du format NestJS actuel : { id, email, nom, role }
    
    let userId: number;
    let userIdentifier: string;

    // Détection du format du payload
    if (payload.username && payload.roles) {
      // Format Symfony
      userId = payload.id;
      userIdentifier = payload.username;
    } else if (payload.email) {
      // Format NestJS actuel
      userId = payload.id;
      userIdentifier = payload.email;
    } else {
      throw new UnauthorizedException({
        success: false,
        statusCode: 401,
        code: 'failure',
        title: 'UnauthorizedException',
        message: 'Format de token invalide.',
        data: [],
      });
    }

    // Vérifier si l'utilisateur existe dans la base de données
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
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
      },
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

    // Retourner les informations de l'utilisateur au format NestJS
    // (pour maintenir la compatibilité avec le reste de l'application)
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role?.nom || null,
      roleId: user.role?.id || null,
      idService: user.idService,
      service: user.service,
    };
  }
}
