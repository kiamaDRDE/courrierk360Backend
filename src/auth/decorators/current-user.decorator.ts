// src/auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Si un paramètre est passé (ex: 'sub', 'id', 'email'), retourner cette propriété
    if (data && user) {
      return user[data];
    }
    
    // Sinon retourner l'objet user complet
    return user;
  },
);
