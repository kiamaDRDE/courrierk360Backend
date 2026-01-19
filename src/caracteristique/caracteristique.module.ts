import { Module } from '@nestjs/common';
import { CaracteristiqueController } from './caracteristique.controller';
import { CaracteristiqueService } from './caracteristique.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CaracteristiqueController],
  providers: [CaracteristiqueService],
  exports: [CaracteristiqueService],
})
export class CaracteristiqueModule {}
