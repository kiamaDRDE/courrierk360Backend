// src/correspondant/correspondant.module.ts

import { Module } from '@nestjs/common';
import { CorrespondantController } from './correspondant.controller';
import { CorrespondantService } from './correspondant.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CorrespondantController],
  providers: [CorrespondantService],
  exports: [CorrespondantService],
})
export class CorrespondantModule {}
