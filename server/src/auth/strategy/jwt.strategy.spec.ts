import { ConfigService } from '@nestjs/config';
import { UsuarioAutenticado } from '../types/autenticado';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy({
      get: (chave: string) => (chave === 'JWT_SECRET' ? 'segredo' : null),
    } as unknown as ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('retorna o payload com sub, email e roles', () => {
    const payload: UsuarioAutenticado = {
      sub: 1,
      email: 'cliente@example.com',
      roles: ['CLIENT'],
    };
    expect(strategy.validate(payload)).toEqual(payload);
  });
});
