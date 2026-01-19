import { Module } from '@nestjs/common';
import { AvantageService } from './avantage.service';
import { AvantageController } from './avantage.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AvantageController],
  providers: [AvantageService],
  exports: [AvantageService],
})
export class AvantageModule {}
