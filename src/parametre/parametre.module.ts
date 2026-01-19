import { Module } from '@nestjs/common';
import { ParametreService } from './parametre.service';
import { ParametreController } from './parametre.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParametreController],
  providers: [ParametreService],
  exports: [ParametreService],
})
export class ParametreModule {}
