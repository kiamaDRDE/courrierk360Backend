// src/type-courrier/type-courrier.module.ts

import { Module } from '@nestjs/common';
import { TypeCourrierController } from './type-courrier.controller';
import { TypeCourrierService } from './type-courrier.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TypeCourrierController],
  providers: [TypeCourrierService],
  exports: [TypeCourrierService],
})
export class TypeCourrierModule {}
