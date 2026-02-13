// src/courrier/courrier.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { CourrierService } from './courrier.service';
import { CourrierController } from './courrier.controller';
import { CourrierPublicController } from './courrier-public.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { MailerModule } from '../mailer/mailer.module';
import { SmsModule } from '../sms/sms.module';
import { TraitementModule } from '../traitement/traitement.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    MailerModule,
    SmsModule,
    forwardRef(() => TraitementModule),
  ],
  controllers: [CourrierController, CourrierPublicController],
  providers: [CourrierService],
  exports: [CourrierService],
})
export class CourrierModule {}
