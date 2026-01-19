// src/signup/signup.module.ts

import { Module } from '@nestjs/common';
import { SignupService } from './signup.service';
import { SignupController } from './signup.controller';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [MailerModule],
  controllers: [SignupController],
  providers: [SignupService],
})
export class SignupModule {}
