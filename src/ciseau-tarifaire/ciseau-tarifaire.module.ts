import { Module } from '@nestjs/common';
import { CiseauTarifaireService } from './ciseau-tarifaire.service';
import { CiseauTarifaireController } from './ciseau-tarifaire.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CiseauTarifaireController],
  providers: [CiseauTarifaireService],
  exports: [CiseauTarifaireService]
})
export class CiseauTarifaireModule {}
