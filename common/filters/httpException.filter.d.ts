// src/common/filters/httpException.filter.d.ts

import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void;
  private buildErrorResponse;
}
