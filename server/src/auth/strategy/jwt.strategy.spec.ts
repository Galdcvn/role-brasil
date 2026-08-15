import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const config = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    strategy = new JwtStrategy(config);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return the payload', () => {
    const payload = { sub: 1, email: 'cliente@example.com' };
    expect(strategy.validate(payload)).toEqual(payload);
  });
});
