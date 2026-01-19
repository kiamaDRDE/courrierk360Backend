// src/forgot-password/forgot-password.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ForgotPasswordController } from './forgot-password.controller';
import { ForgotPasswordService } from './forgot-password.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'patnuc-segmentation-secret-key-2025',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [ForgotPasswordController],
  providers: [ForgotPasswordService],
  exports: [ForgotPasswordService],
})
export class ForgotPasswordModule {}
