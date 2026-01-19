// src/forgot-password/decorators/reset-token.decorator.ts

import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const ResetToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant. Veuillez vous authentifier.');
    }

    // Extraire le token (enlever "Bearer ")
    return authorization.substring(7);
  },
);
