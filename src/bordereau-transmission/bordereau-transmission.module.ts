// src/bordereau-transmission/bordereau-transmission.module.ts

import { Module } from '@nestjs/common';
import { BordereauTransmissionService } from './bordereau-transmission.service';
import { BordereauTransmissionController } from './bordereau-transmission.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [BordereauTransmissionController],
  providers: [BordereauTransmissionService],
  exports: [BordereauTransmissionService],
})
export class BordereauTransmissionModule {}
