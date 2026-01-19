import { Module } from '@nestjs/common';
import { TraficService } from './trafic.service';
import { TraficController } from './trafic.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TraficController],
  providers: [TraficService],
  exports: [TraficService]
})
export class TraficModule {}
