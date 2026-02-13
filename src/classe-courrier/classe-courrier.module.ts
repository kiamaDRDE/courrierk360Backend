// src/classe-courrier/classe-courrier.module.ts

import { Module } from '@nestjs/common';
import { ClasseCourrierService } from './classe-courrier.service';
import { ClasseCourrierController } from './classe-courrier.controller';

@Module({
  controllers: [ClasseCourrierController],
  providers: [ClasseCourrierService],
  exports: [ClasseCourrierService],
})
export class ClasseCourrierModule {}
