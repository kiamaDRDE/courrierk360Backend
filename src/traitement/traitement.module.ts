// src/traitement/traitement.module.ts

import { Module, forwardRef } from '@nestjs/common';
import { TraitementService } from './traitement.service';
import { TraitementController } from './traitement.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { MailerModule } from '../mailer/mailer.module';
import { SmsModule } from '../sms/sms.module';
import { CourrierModule } from '../courrier/courrier.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    MailerModule,
    SmsModule,
    forwardRef(() => CourrierModule),
  ],
  controllers: [TraitementController],
  providers: [TraitementService],
  exports: [TraitementService],
})
export class TraitementModule {}
