import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DechargeController } from './decharge.controller';
import { DechargeService } from './decharge.service';

@Module({
  imports: [PrismaModule],
  controllers: [DechargeController],
  providers: [DechargeService],
  exports: [DechargeService],
})
export class DechargeModule {}
