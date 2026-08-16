import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    expect(new JwtAuthGuard(new Reflector())).toBeDefined();
  });

  it('libera rotas marcadas com @Public sem validar o JWT', () => {
    const guard = new JwtAuthGuard(new Reflector());
    const handler = () => undefined;
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);

    const context = {
      getHandler: () => handler,
      getClass: () => Object,
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });
});
