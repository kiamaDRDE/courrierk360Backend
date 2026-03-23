import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjetController } from './projet.controller';
import { ProjetSyncController } from './projet-sync.controller';
import { ProjetService } from './projet.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjetController, ProjetSyncController],
  providers: [ProjetService],
})
export class ProjetModule {}
