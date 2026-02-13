// src/salle/salle.module.ts

import { Module } from '@nestjs/common';
import { SalleController } from './salle.controller';
import { SalleService } from './salle.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [SalleController],
  providers: [SalleService],
  exports: [SalleService],
})
export class SalleModule {}
