import { Module } from '@nestjs/common';
import { ChiffreAffaireService } from './chiffre-affaire.service';
import { ChiffreAffaireController } from './chiffre-affaire.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChiffreAffaireController],
  providers: [ChiffreAffaireService],
  exports: [ChiffreAffaireService]
})
export class ChiffreAffaireModule {}
