// src/coffre/coffre.module.ts

import { Module } from '@nestjs/common';
import { CoffreController } from './coffre.controller';
import { CoffreService } from './coffre.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [CoffreController],
  providers: [CoffreService],
  exports: [CoffreService],
})
export class CoffreModule {}
