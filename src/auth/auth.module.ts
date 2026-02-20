// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import * as fs from 'fs';
import * as path from 'path';

// Fonction pour charger les clés JWT (depuis variable d'environnement ou fichier)
function loadJwtKey(envKey: string, filePathEnvKey: string): string | undefined {
  // 1. Essayer de charger depuis la variable d'environnement directe
  const keyFromEnv = process.env[envKey];
  if (keyFromEnv) {
    return keyFromEnv.replace(/\\n/g, '\n');
  }

  // 2. Essayer de charger depuis un fichier
  const keyFilePath = process.env[filePathEnvKey];
  if (keyFilePath) {
    try {
      const fullPath = path.resolve(process.cwd(), keyFilePath);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf8');
      }
    } catch (error) {
      console.warn(`Impossible de lire le fichier de clé ${keyFilePath}:`, error);
    }
  }

  return undefined;
}

const jwtPrivateKey = loadJwtKey('JWT_PRIVATE_KEY', 'JWT_PRIVATE_KEY_PATH');
const jwtPublicKey = loadJwtKey('JWT_PUBLIC_KEY', 'JWT_PUBLIC_KEY_PATH');
const jwtPassphrase = process.env.JWT_PRIVATE_KEY_PASSPHRASE;

// Déterminer si on peut utiliser la clé privée pour signer
// Si la clé privée est chiffrée mais pas de passphrase, on ne peut pas l'utiliser
const canUsePrivateKey = jwtPrivateKey && (!jwtPrivateKey.includes('ENCRYPTED') || jwtPassphrase);

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      // Utiliser HS256 avec JWT_SECRET pour signer nos propres tokens
      // (la clé privée Symfony est chiffrée et nécessite un mot de passe)
      secret: process.env.JWT_SECRET || 'patnuc-segmentation-secret-key-2025',
      signOptions: {
        expiresIn: '24h',
        algorithm: 'HS256', // Toujours utiliser HS256 pour la signature
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
