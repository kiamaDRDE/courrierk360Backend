import { Module } from '@nestjs/common';
import { AbonnementService } from './abonnement.service';
import { AbonnementController } from './abonnement.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AbonnementController],
  providers: [AbonnementService],
  exports: [AbonnementService]
})
export class AbonnementModule {}
