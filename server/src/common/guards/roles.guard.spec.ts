import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let getRequest: jest.Mock;
  let context: ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    getRequest = jest.fn();
    guard = new RolesGuard(reflector as unknown as Reflector);
    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest }),
    } as unknown as ExecutionContext;
  });

  it('should allow when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow when the required roles list is empty', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow when the user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ORGANIZADOR']);
    getRequest.mockReturnValue({ user: { roles: ['ORGANIZADOR'] } });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny when the user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ORGANIZADOR']);
    getRequest.mockReturnValue({ user: { roles: ['CLIENTE'] } });
    expect(guard.canActivate(context)).toBe(false);
  });
});
