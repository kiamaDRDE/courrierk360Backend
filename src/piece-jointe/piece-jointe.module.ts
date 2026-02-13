import { Module } from '@nestjs/common';
import { PieceJointeService } from './piece-jointe.service';
import { PieceJointeController } from './piece-jointe.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PieceJointeController],
  providers: [PieceJointeService],
  exports: [PieceJointeService],
})
export class PieceJointeModule {}
