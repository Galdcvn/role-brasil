import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
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
  };
  let jwtMock: { sign: jest.Mock };
  let configMock: { get: jest.Mock };
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
    };
    jwtMock = { sign: jest.fn().mockReturnValue('token-jwt') };
    configMock = { get: jest.fn().mockReturnValue('true') };
    service = new AuthService(
      repositoryMock as unknown as UsuarioRepository,
      jwtMock as unknown as JwtService,
      configMock as unknown as ConfigService,
    );
  });

  describe('registrar', () => {
    const dto: RegistrarDto = {
      nome: 'Ana',
      email: 'ana@example.com',
      senha: 'segredo1',
    };

    it('cria o usuário, grava o OTP e devolve o código quando o fallback está ativo', async () => {
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
      });
      const chamadas = repositoryMock.create.mock.calls as unknown as [
        RegistrarDto & { senha: string },
      ][];
      const { senha } = chamadas[0][0];
      expect(senha).not.toBe('segredo1');
      expect(await bcrypt.compare('segredo1', senha)).toBe(true);

      expect(repositoryMock.setCodigoVerificacao).toHaveBeenCalledWith(
        1,
        expect.any(Number),
        expect.any(Date),
      );
      expect(resultado).toHaveProperty('codigo');
      const codigo = (resultado as { codigo: number }).codigo;
      expect(codigo).toBeGreaterThanOrEqual(100000);
      expect(codigo).toBeLessThanOrEqual(999999);
      expect(resultado).toEqual({
        id: 1,
        nome: 'Ana',
        email: 'ana@example.com',
        verificado: false,
        codigo,
      });
    });

    it('não devolve o código quando o fallback está desativado', async () => {
      configMock.get.mockReturnValue('false');
      repositoryMock.create.mockResolvedValue({ id: 1, verificado: false });

      const resultado = await service.registrar(dto);

      expect(resultado).not.toHaveProperty('codigo');
    });

    it('lança ConflictException quando o e-mail já existe', async () => {
      repositoryMock.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed on the fields: (`email`)',
          { code: 'P2002', clientVersion: '6.19.3' },
        ),
      );

      await expect(service.registrar(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('propaga erros que não são de unicidade', async () => {
      const erro = new Error('banco indisponível');
      repositoryMock.create.mockRejectedValue(erro);

      await expect(service.registrar(dto)).rejects.toBe(erro);
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

    it('aceita o código de fallback em ambiente de dev', async () => {
      repositoryMock.findByEmail.mockResolvedValue({
        id: 1,
        codigoVerificacao: 654321,
        codigoVerificacaoExpiraEm: new Date(Date.now() + 60_000),
      });

      await service.verificarEmail({
        email: 'ana@example.com',
        codigo: 0,
      });

      expect(repositoryMock.updateVerificado).toHaveBeenCalledWith(1);
    });

    it('lança UnauthorizedException para usuário inexistente', async () => {
      repositoryMock.findByEmail.mockResolvedValue(null);

      await expect(
        service.verificarEmail({ email: 'nao@existe.com', codigo: 123456 }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
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
});
