// src/courrier-interne/courrier-interne.module.ts

import { Module } from '@nestjs/common';
import { CourrierInterneController } from './courrier-interne.controller';
import { CourrierInterneService } from './courrier-interne.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { MailerModule } from '../mailer/mailer.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [PrismaModule, CommonModule, MailerModule, SmsModule],
  controllers: [CourrierInterneController],
  providers: [CourrierInterneService],
})
export class CourrierInterneModule {}
