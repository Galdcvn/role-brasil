import { AuthService } from '../auth.service';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authServiceMock: { validarCredenciais: jest.Mock };

  beforeEach(() => {
    authServiceMock = { validarCredenciais: jest.fn() };
    strategy = new LocalStrategy(authServiceMock as unknown as AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('valida as credenciais no AuthService', async () => {
    const usuario = {
      id: 1,
      nome: 'Ana',
      email: 'cliente@example.com',
      roles: ['CLIENT'],
    };
    authServiceMock.validarCredenciais.mockResolvedValue(usuario);

    const resultado = await strategy.validate(
      'cliente@example.com',
      'segredo1',
    );

    expect(authServiceMock.validarCredenciais).toHaveBeenCalledWith(
      'cliente@example.com',
      'segredo1',
    );
    expect(resultado).toEqual(usuario);
  });
});
