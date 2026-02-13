// src/common/common.module.ts

import { Global, Module } from '@nestjs/common';
import { ResponseFormatterService } from './response-formatter.service';
import { PaginationService } from './pagination.service';
import { SearchService } from './search.service';

@Global()
@Module({
  providers: [ResponseFormatterService, PaginationService, SearchService],
  exports: [ResponseFormatterService, PaginationService, SearchService],
})
export class CommonModule {}
