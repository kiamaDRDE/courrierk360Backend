// src/courrier-depart/courrier-depart.module.ts

import { Module } from '@nestjs/common';
import { CourrierDepartController } from './courrier-depart.controller';
import { CourrierDepartService } from './courrier-depart.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { MailerModule } from '../mailer/mailer.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [PrismaModule, CommonModule, MailerModule, SmsModule],
  controllers: [CourrierDepartController],
  providers: [CourrierDepartService],
})
export class CourrierDepartModule {}
