import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;

  beforeEach(() => {
    strategy = new LocalStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return the credentials', () => {
    expect(strategy.validate('cliente@example.com', 'secret')).toEqual({
      email: 'cliente@example.com',
      password: 'secret',
    });
  });
});
