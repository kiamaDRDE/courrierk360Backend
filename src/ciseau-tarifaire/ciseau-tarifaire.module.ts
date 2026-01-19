import { Module, forwardRef } from '@nestjs/common';
import { CiseauTarifaireService } from './ciseau-tarifaire.service';
import { CiseauTarifaireController } from './ciseau-tarifaire.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EffetClubModule } from '../effet-club/effet-club.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => EffetClubModule)
  ],
  controllers: [CiseauTarifaireController],
  providers: [CiseauTarifaireService],
  exports: [CiseauTarifaireService]
})
export class CiseauTarifaireModule {}
