// src/log/log.module.ts

import { Module } from '@nestjs/common';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { LogHelper } from './helpers/log.helper';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LogController],
  providers: [LogService, LogHelper],
  exports: [LogService, LogHelper], // Exporter pour utilisation dans d'autres modules
})
export class LogModule {}
