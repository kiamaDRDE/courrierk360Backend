// src/user/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // L'utilisateur est déjà injecté par le JwtAuthGuard via Passport
    return request.user;
  },
);
