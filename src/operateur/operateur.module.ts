// src/operateur/operateur.module.ts

import { Module } from '@nestjs/common';
import { OperateurController } from './operateur.controller';
import { OperateurService } from './operateur.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OperateurController],
  providers: [OperateurService],
  exports: [OperateurService],
})
export class OperateurModule {}
