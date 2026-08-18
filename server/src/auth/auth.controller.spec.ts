import { Request } from 'express';
import { AuthController } from './auth.controller';
import { AuthService, UsuarioLogado } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegistrarDto } from './dto/registrar.dto';
import { VerificarEmailDto } from './dto/verificar-email.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let serviceMock: {
    registrar: jest.Mock;
    verificarEmail: jest.Mock;
    reenviarCodigo: jest.Mock;
    login: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      registrar: jest.fn(),
      verificarEmail: jest.fn(),
      reenviarCodigo: jest.fn(),
      login: jest.fn(),
    };
    controller = new AuthController(serviceMock as unknown as AuthService);
  });

  it('registrar repassa o dto de registro', () => {
    const dto: RegistrarDto = {
      nome: 'Ana',
      email: 'ana@example.com',
      senha: 'segredo1',
    };
    serviceMock.registrar.mockReturnValue({ id: 1 });

    const resultado = controller.registrar(dto);

    expect(serviceMock.registrar).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual({ id: 1 });
  });

  it('verificarEmail repassa o dto de verificação', () => {
    const dto: VerificarEmailDto = { email: 'ana@example.com', codigo: 123456 };
    serviceMock.verificarEmail.mockReturnValue({ mensagem: 'ok' });

    const resultado = controller.verificarEmail(dto);

    expect(serviceMock.verificarEmail).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual({ mensagem: 'ok' });
  });

  it('reenviarCodigo repassa o email', () => {
    serviceMock.reenviarCodigo.mockReturnValue({ mensagem: 'ok' });

    const resultado = controller.reenviarCodigo({ email: 'ana@example.com' });

    expect(serviceMock.reenviarCodigo).toHaveBeenCalledWith('ana@example.com');
    expect(resultado).toEqual({ mensagem: 'ok' });
  });

  it('login repassa o usuário autenticado pela strategy local', () => {
    const dto: LoginDto = { email: 'ana@example.com', senha: 'segredo1' };
    const req = {
      user: { id: 1, nome: 'Ana', email: 'ana@example.com', roles: ['CLIENT'] },
    } as unknown as Request & { user: UsuarioLogado };
    serviceMock.login.mockReturnValue({ access_token: 'token' });

    const resultado = controller.login(dto, req);

    expect(serviceMock.login).toHaveBeenCalledWith({
      id: 1,
      nome: 'Ana',
      email: 'ana@example.com',
      roles: ['CLIENT'],
    });
    expect(resultado).toEqual({ access_token: 'token' });
  });
});
