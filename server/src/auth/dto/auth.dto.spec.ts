import { LoginDto } from './login.dto';
import { RegistrarDto } from './registrar.dto';
import { VerificarEmailDto } from './verificar-email.dto';

describe('Auth DTOs', () => {
  it('cria instâncias de todos os DTOs de auth', () => {
    const registrar = new RegistrarDto();
    registrar.nome = 'Ana';
    registrar.email = 'ana@example.com';
    registrar.senha = 'segredo1';

    const verificar = new VerificarEmailDto();
    verificar.email = 'ana@example.com';
    verificar.codigo = 123456;

    const login = new LoginDto();
    login.email = 'ana@example.com';
    login.senha = 'segredo1';

    expect(registrar).toBeInstanceOf(RegistrarDto);
    expect(registrar.nome).toBe('Ana');
    expect(verificar).toBeInstanceOf(VerificarEmailDto);
    expect(verificar.codigo).toBe(123456);
    expect(login).toBeInstanceOf(LoginDto);
    expect(login.email).toBe('ana@example.com');
  });
});
