import { Module } from '@nestjs/common';
import { TarifInterconnexionService } from './tarif-interconnexion.service';
import { TarifInterconnexionController } from './tarif-interconnexion.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TarifInterconnexionController],
  providers: [TarifInterconnexionService],
  exports: [TarifInterconnexionService],
})
export class TarifInterconnexionModule {}
