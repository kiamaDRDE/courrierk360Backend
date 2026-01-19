import { Module } from '@nestjs/common';
import { IhhService } from './ihh.service';
import { IhhController } from './ihh.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IhhController],
  providers: [IhhService],
  exports: [IhhService]
})
export class IhhModule {}
