import { Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServicesController } from './services.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServicesController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServicesModule {}
