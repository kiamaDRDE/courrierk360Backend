import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjetController } from './projet.controller';
import { ProjetService } from './projet.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjetController],
  providers: [ProjetService],
})
export class ProjetModule {}
