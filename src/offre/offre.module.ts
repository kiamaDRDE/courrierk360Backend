import { Module } from '@nestjs/common';
import { OffreController } from './offre.controller';
import { OffreService } from './offre.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OffreController],
  providers: [OffreService],
  exports: [OffreService],
})
export class OffreModule {}
