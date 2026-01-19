import { Module } from '@nestjs/common';
import { StructureTarifaireService } from './structure-tarifaire.service';
import { StructureTarifaireController } from './structure-tarifaire.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StructureTarifaireController],
  providers: [StructureTarifaireService],
  exports: [StructureTarifaireService],
})
export class StructureTarifaireModule {}
