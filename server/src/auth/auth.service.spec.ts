import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioRepository } from '../usuario/usuario.repository';
import { AuthService } from './auth.service';
import { RegistrarDto } from './dto/registrar.dto';

describe('AuthService', () => {
  let service: AuthService;
  let repositoryMock: {
    create: jest.Mock;
    findByEmail: jest.Mock;
    findByEmailComSenha: jest.Mock;
    setCodigoVerificacao: jest.Mock;
    updateVerificado: jest.Mock;
    adicionarPapel: jest.Mock;
    updateSenha: jest.Mock;
  };
  let jwtMock: { sign: jest.Mock };
  let senhaHash: string;

  beforeAll(async () => {
    senhaHash = await bcrypt.hash('segredo1', 10);
  });

  beforeEach(() => {
    repositoryMock = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailComSenha: jest.fn(),
      setCodigoVerificacao: jest.fn(),
      updateVerificado: jest.fn(),
      adicionarPapel: jest.fn(),
      updateSenha: jest.fn(),
    };
    jwtMock = { sign: jest.fn().mockReturnValue('token-jwt') };
    service = new AuthService(
      repositoryMock as unknown as UsuarioRepository,
      jwtMock as unknown as JwtService,
    );
  });

  describe('registrar', () => {
    const dto: RegistrarDto = {
      nome: 'Ana',
      email: 'ana@example.com',
      senha: 'segredo1',
    };

    it('cria o usuário novo e grava o OTP', async () => {
      repositoryMock.findByEmail.mockResolvedValue(null);
      repositoryMock.create.mockResolvedValue({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        verificado: false,
      });

      const resultado = await service.registrar(dto);

      expect(repositoryMock.create).toHaveBeenCalledWith({
        nome: 'Ana',
        email: 'ana@example.com',
        senha: expect.any(String) as string,
        papel: 'CLIENT',
      });
      const chamadas = repositoryMock.create.mock.calls as unknown as [
        RegistrarDto & { senha: string; papel: string },
      ][];
      const { senha } = chamadas[0][0];
      expect(senha).not.toBe('segredo1');
      expect(await bcrypt.compare('segredo1', senha)).toBe(true);

      expect(repositoryMock.setCodigoVerificacao).toHaveBeenCalledWith(
        1,
        expect.any(Number),
        expect.any(Date),
      );
      expect(resultado).not.toHaveProperty('codigo');
      expect(resultado).toEqual({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        verificado: false,
      });
    });

    it('usa o papel informado no registro', async () => {
      repositoryMock.findByEmail.mockResolvedValue(null);
      repositoryMock.create.mockResolvedValue({ id: 2, verificado: false });

      await service.registrar({ ...dto, papel: 'ORGANIZER' });

      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ papel: 'ORGANIZER' }),
      );
    });

    it('adiciona papel quando email já existe mas o papel não está vinculado', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        verificado: true,
        papeis: [{ papel: { nome: 'CLIENT' } }],
      });

      const resultado = await service.registrar({
        ...dto,
        papel: 'ORGANIZER',
      });

      expect(repositoryMock.adicionarPapel).toHaveBeenCalledWith(
        1,
        'ORGANIZER',
      );
      expect(repositoryMock.create).not.toHaveBeenCalled();
      expect(repositoryMock.setCodigoVerificacao).not.toHaveBeenCalled();
      expect(resultado).toEqual({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        verificado: true,
      });
    });

    it('adiciona papel e reenvia OTP quando email existe e não está verificado', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        verificado: false,
        papeis: [{ papel: { nome: 'CLIENT' } }],
      });

      const resultado = await service.registrar({
        ...dto,
        papel: 'ORGANIZER',
      });

      expect(repositoryMock.adicionarPapel).toHaveBeenCalledWith(
        1,
        'ORGANIZER',
      );
      expect(repositoryMock.setCodigoVerificacao).toHaveBeenCalled();
      expect(resultado).not.toHaveProperty('codigo');
    });

    it('reenvia OTP quando papel já vinculado mas não verificado (sem 409)', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        verificado: false,
        papeis: [{ papel: { nome: 'CLIENT' } }],
      });

      const resultado = await service.registrar(dto);

      expect(repositoryMock.setCodigoVerificacao).toHaveBeenCalled();
      expect(resultado).toEqual({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        verificado: false,
      });
    });

    it('lança ConflictException quando o email já existe, papel vinculado e verificado', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        verificado: true,
        papeis: [{ papel: { nome: 'CLIENT' } }],
      });

      await expect(service.registrar(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repositoryMock.adicionarPapel).not.toHaveBeenCalled();
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe('verificarEmail', () => {
    it('verifica o e-mail quando o código e a expiração são válidos', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        codigoVerificacao: 123456,
        codigoVerificacaoExpiraEm: new Date(Date.now() + 60_000),
      });

      const resultado = await service.verificarEmail({
        email: 'ana@example.com',
        codigo: 123456,
      });

      expect(repositoryMock.updateVerificado).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ mensagem: 'E-mail verificado com sucesso' });
    });

    it('lança UnauthorizedException para código incorreto', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        codigoVerificacao: 111111,
        codigoVerificacaoExpiraEm: new Date(Date.now() + 60_000),
      });

      await expect(
        service.verificarEmail({ email: 'ana@example.com', codigo: 222222 }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException para código expirado', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        codigoVerificacao: 123456,
        codigoVerificacaoExpiraEm: new Date(Date.now() - 60_000),
      });

      await expect(
        service.verificarEmail({ email: 'ana@example.com', codigo: 123456 }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException quando não há código gravado', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        codigoVerificacao: null,
        codigoVerificacaoExpiraEm: null,
      });

      await expect(
        service.verificarEmail({ email: 'ana@example.com', codigo: 123456 }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException para usuário inexistente', async () => {
      repositoryMock.findByEmail.mockResolvedValue(null);

      await expect(
        service.verificarEmail({ email: 'nao@existe.com', codigo: 123456 }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('aceita código 0 como bypass (sempre permitido)', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        codigoVerificacao: 768846,
        codigoVerificacaoExpiraEm: new Date(Date.now() + 60_000),
      });

      const resultado = await service.verificarEmail({
        email: 'ana@example.com',
        codigo: 0,
      });

      expect(repositoryMock.updateVerificado).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ mensagem: 'E-mail verificado com sucesso' });
    });
  });

  describe('reenviarCodigo', () => {
    it('reenvia código para usuário não verificado', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        verificado: false,
      });

      const resultado = await service.reenviarCodigo('ana@example.com');

      expect(repositoryMock.setCodigoVerificacao).toHaveBeenCalledWith(
        1,
        expect.any(Number),
        expect.any(Date),
      );
      expect(resultado).toEqual({
        mensagem: 'Código reenviado com sucesso',
      });
    });

    it('retorna mensagem quando e-mail já verificado', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        verificado: true,
      });

      const resultado = await service.reenviarCodigo('ana@example.com');

      expect(repositoryMock.setCodigoVerificacao).not.toHaveBeenCalled();
      expect(resultado).toEqual({ mensagem: 'E-mail já verificado' });
    });

    it('lança NotFoundException para usuário inexistente', async () => {
      repositoryMock.findByEmail.mockResolvedValue(null);

      await expect(
        service.reenviarCodigo('nao@existe.com'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('validarCredenciais', () => {
    it('retorna o usuário com papéis quando as credenciais são válidas', async () => {
      repositoryMock.findByEmailComSenha.mockResolvedValue({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        verificado: true,
        ativo: true,
        senha: senhaHash,
        papeis: [{ papel: { nome: 'CLIENT' } }],
      });

      const resultado = await service.validarCredenciais(
        'ana@example.com',
        'segredo1',
      );

      expect(resultado).toEqual({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        roles: ['CLIENT'],
      });
    });

    it('lança UnauthorizedException para usuário inexistente', async () => {
      repositoryMock.findByEmailComSenha.mockResolvedValue(null);

      await expect(
        service.validarCredenciais('nao@existe.com', 'segredo1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException para usuário inativo', async () => {
      repositoryMock.findByEmailComSenha.mockResolvedValue({
        id: 1,
        verificado: true,
        ativo: false,
        senha: senhaHash,
        papeis: [],
      });

      await expect(
        service.validarCredenciais('ana@example.com', 'segredo1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException para e-mail não verificado', async () => {
      repositoryMock.findByEmailComSenha.mockResolvedValue({
        id: 1,
        verificado: false,
        ativo: true,
        senha: senhaHash,
        papeis: [],
      });

      await expect(
        service.validarCredenciais('ana@example.com', 'segredo1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException para senha incorreta', async () => {
      repositoryMock.findByEmailComSenha.mockResolvedValue({
        id: 1,
        verificado: true,
        ativo: true,
        senha: senhaHash,
        papeis: [],
      });

      await expect(
        service.validarCredenciais('ana@example.com', 'senha-errada'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('gera um access token com sub, email e roles', () => {
      const resultado = service.login({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        roles: ['CLIENT'],
      });

      expect(jwtMock.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'ana@example.com',
        roles: ['CLIENT'],
      });
      expect(resultado).toEqual({ access_token: 'token-jwt' });
    });
  });

  describe('esqueciSenha', () => {
    it('retorna mensagem genérica quando usuário não existe', async () => {
      repositoryMock.findByEmail.mockResolvedValue(null);
      const resultado = await service.esqueciSenha('nao@existe.com');
      expect(repositoryMock.setCodigoVerificacao).not.toHaveBeenCalled();
      expect(resultado).toEqual({
        mensagem: 'Se o e-mail estiver cadastrado, você receberá um código.',
      });
    });

    it('retorna mensagem genérica quando email não está verificado', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        verificado: false,
      });
      const resultado = await service.esqueciSenha('ana@example.com');
      expect(repositoryMock.setCodigoVerificacao).not.toHaveBeenCalled();
      expect(resultado).toEqual({
        mensagem: 'Se o e-mail estiver cadastrado, você receberá um código.',
      });
    });

    it('gera código e retorna mensagem quando email existe e está verificado', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        verificado: true,
      });
      const resultado = await service.esqueciSenha('ana@example.com');
      expect(repositoryMock.setCodigoVerificacao).toHaveBeenCalledWith(
        1,
        expect.any(Number),
        expect.any(Date),
      );
      expect(resultado).toEqual({
        mensagem: 'Se o e-mail estiver cadastrado, você receberá um código.',
      });
    });
  });

  describe('redefinirSenha', () => {
    it('lança UnauthorizedException quando usuário não existe', async () => {
      repositoryMock.findByEmail.mockResolvedValue(null);
      await expect(
        service.redefinirSenha({
          email: 'nao@existe.com',
          codigo: 123456,
          novaSenha: 'nova123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException para código incorreto', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        codigoVerificacao: 111111,
        codigoVerificacaoExpiraEm: new Date(Date.now() + 60_000),
      });
      await expect(
        service.redefinirSenha({
          email: 'ana@example.com',
          codigo: 222222,
          novaSenha: 'nova123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException para código expirado', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        codigoVerificacao: 123456,
        codigoVerificacaoExpiraEm: new Date(Date.now() - 60_000),
      });
      await expect(
        service.redefinirSenha({
          email: 'ana@example.com',
          codigo: 123456,
          novaSenha: 'nova123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('redefine a senha com código válido', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        codigoVerificacao: 123456,
        codigoVerificacaoExpiraEm: new Date(Date.now() + 60_000),
      });
      repositoryMock.updateSenha.mockResolvedValue(undefined);
      const resultado = await service.redefinirSenha({
        email: 'ana@example.com',
        codigo: 123456,
        novaSenha: 'nova-senha',
      });
      expect(repositoryMock.updateSenha).toHaveBeenCalledWith(
        1,
        expect.any(String) as string,
      );
      const args = repositoryMock.updateSenha.mock.calls[0] as unknown as [
        number,
        string,
      ];
      const hashedSenha = args[1];
      expect(await bcrypt.compare('nova-senha', hashedSenha)).toBe(true);
      expect(resultado).toEqual({ mensagem: 'Senha redefinida com sucesso' });
    });

    it('aceita código 0 como bypass', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        codigoVerificacao: 999999,
        codigoVerificacaoExpiraEm: new Date(Date.now() + 60_000),
      });
      repositoryMock.updateSenha.mockResolvedValue(undefined);
      const resultado = await service.redefinirSenha({
        email: 'ana@example.com',
        codigo: 0,
        novaSenha: 'nova-senha',
      });
      expect(repositoryMock.updateSenha).toHaveBeenCalled();
      expect(resultado).toEqual({ mensagem: 'Senha redefinida com sucesso' });
    });
  });
});
