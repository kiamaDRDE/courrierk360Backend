import { Module } from '@nestjs/common';
import { EffetClubController } from './effet-club.controller';
import { EffetClubService } from './effet-club.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EffetClubController],
  providers: [EffetClubService],
  exports: [EffetClubService],
})
export class EffetClubModule {}
