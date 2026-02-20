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

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      ...(jwtPrivateKey
        ? {
            privateKey: jwtPassphrase
              ? { key: jwtPrivateKey, passphrase: jwtPassphrase }
              : jwtPrivateKey,
          }
        : {
            secret: process.env.JWT_SECRET || 'patnuc-segmentation-secret-key-2025',
          }),
      ...(jwtPublicKey ? { publicKey: jwtPublicKey } : {}),
      signOptions: {
        expiresIn: '24h',
        algorithm: jwtPrivateKey ? 'RS256' : 'HS256',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
