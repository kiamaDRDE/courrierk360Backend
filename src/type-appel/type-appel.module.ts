import { Module } from '@nestjs/common';
import { TypeAppelController } from './type-appel.controller';
import { TypeAppelService } from './type-appel.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TypeAppelController],
  providers: [TypeAppelService],
  exports: [TypeAppelService],
})
export class TypeAppelModule {}
