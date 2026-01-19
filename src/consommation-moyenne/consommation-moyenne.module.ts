import { Module } from '@nestjs/common';
import { ConsommationMoyenneService } from './consommation-moyenne.service';
import { ConsommationMoyenneController } from './consommation-moyenne.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConsommationMoyenneController],
  providers: [ConsommationMoyenneService],
  exports: [ConsommationMoyenneService],
})
export class ConsommationMoyenneModule {}
