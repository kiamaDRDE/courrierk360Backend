import { Module } from '@nestjs/common';
import { TypeOperateurService } from './type-operateur.service';
import { TypeOperateurController } from './type-operateur.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TypeOperateurController],
  providers: [TypeOperateurService],
  exports: [TypeOperateurService],
})
export class TypeOperateurModule {}
