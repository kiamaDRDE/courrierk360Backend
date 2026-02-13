// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';

const jwtPrivateKey = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const jwtPublicKey = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n');
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
