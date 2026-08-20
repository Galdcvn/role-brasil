import { PrismaService } from '../prisma/prisma.service';
import {
  NOME_PAPEL_CLIENT,
  NOME_PAPEL_ORGANIZER,
  UsuarioRepository,
} from './usuario.repository';
describe('UsuarioRepository', () => {
  let repository: UsuarioRepository;
  let prismaMock: {
    $transaction: jest.Mock;
    usuario: { findUnique: jest.Mock; update: jest.Mock };
  };
  let txMock: {
    papel: { findFirst: jest.Mock; create: jest.Mock };
    usuario: { create: jest.Mock };
    papeisUsuario: { create: jest.Mock };
  };
  beforeEach(() => {
    txMock = {
      papel: { findFirst: jest.fn(), create: jest.fn() },
      usuario: { create: jest.fn() },
      papeisUsuario: { create: jest.fn() },
    };
    prismaMock = {
      $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
        fn(txMock),
      ),
      usuario: { findUnique: jest.fn(), update: jest.fn() },
    };
    repository = new UsuarioRepository(prismaMock as unknown as PrismaService);
  });
  describe('create', () => {
    it('cria o usuário com o papel CLIENT já existente', async () => {
      txMock.papel.findFirst.mockResolvedValue({
        id: 5,
        nome: NOME_PAPEL_CLIENT,
      });
      txMock.usuario.create.mockResolvedValue({ id: 1, nome: 'Ana' });
      const resultado = await repository.create({
        nome: 'Ana',
        email: 'ana@example.com',
        senha: 'hash',
        papel: NOME_PAPEL_CLIENT,
      });
      expect(txMock.papel.create).not.toHaveBeenCalled();
      expect(txMock.usuario.create).toHaveBeenCalledWith({
        data: {
          nome: 'Ana',
          email: 'ana@example.com',
          senha: 'hash',
          papeis: { create: { papelId: 5 } },
        },
        select: expect.any(Object) as object,
      });
      expect(resultado).toEqual({ id: 1, nome: 'Ana' });
    });
    it('cria o papel informado quando ele ainda não existe', async () => {
      txMock.papel.findFirst.mockResolvedValue(null);
      txMock.papel.create.mockResolvedValue({
        id: 9,
        nome: NOME_PAPEL_ORGANIZER,
      });
      txMock.usuario.create.mockResolvedValue({ id: 2 });
      await repository.create({
        nome: 'Bruno',
        email: 'bruno@example.com',
        senha: 'hash',
        papel: NOME_PAPEL_ORGANIZER,
      });
      expect(txMock.papel.create).toHaveBeenCalledWith({
        data: { nome: NOME_PAPEL_ORGANIZER },
      });
      expect(txMock.usuario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            papeis: { create: { papelId: 9 } },
          }) as object,
        }),
      );
    });
  });
  describe('consultas', () => {
    it('findByEmail busca com papéis e sem senha', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.c',
      });
      const resultado = await repository.findByEmail('a@b.c');
      expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@b.c' },
        select: expect.objectContaining({
          papeis: expect.any(Object) as object,
        }) as object,
      });
      expect(resultado).toEqual({ id: 1, email: 'a@b.c' });
    });
    it('findByEmailComSenha inclui papéis completos', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({ id: 1, senha: 'hash' });
      const resultado = await repository.findByEmailComSenha('a@b.c');
      expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@b.c' },
        include: expect.objectContaining({
          papeis: expect.any(Object) as object,
        }) as object,
      });
      expect(resultado).toEqual({ id: 1, senha: 'hash' });
    });
    it('findById busca pelo id', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({ id: 7 });
      await repository.findById(7);
      expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
        select: expect.any(Object) as object,
      });
    });
  });
  describe('atualizações', () => {
    it('update aplica os dados parciais', async () => {
      prismaMock.usuario.update.mockResolvedValue({ id: 1, nome: 'Novo Nome' });
      const resultado = await repository.update(1, { nome: 'Novo Nome' });
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { nome: 'Novo Nome' },
        select: expect.any(Object) as object,
      });
      expect(resultado).toEqual({ id: 1, nome: 'Novo Nome' });
    });
    it('setCodigoVerificacao grava código e expiração', async () => {
      const expiraEm = new Date('2026-08-16T00:00:00Z');
      prismaMock.usuario.update.mockResolvedValue({ id: 1 });
      await repository.setCodigoVerificacao(1, 123456, expiraEm);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          codigoVerificacao: 123456,
          codigoVerificacaoExpiraEm: expiraEm,
        },
        select: expect.any(Object) as object,
      });
    });
    it('updateVerificado marca verificado e limpa o código', async () => {
      prismaMock.usuario.update.mockResolvedValue({ id: 1 });
      await repository.updateVerificado(1);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          verificado: true,
          codigoVerificacao: null,
          codigoVerificacaoExpiraEm: null,
        },
        select: expect.any(Object) as object,
      });
    });
    it('desativar marca ativo como false', async () => {
      prismaMock.usuario.update.mockResolvedValue({ id: 1 });
      await repository.desativar(1);
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { ativo: false },
        select: expect.any(Object) as object,
      });
    });
  });
  describe('adicionarPapel', () => {
    it('adiciona papel quando já existe', async () => {
      txMock.papel.findFirst.mockResolvedValue({
        id: 5,
        nome: NOME_PAPEL_CLIENT,
      });
      txMock.papeisUsuario.create.mockResolvedValue({
        usuarioId: 1,
        papelId: 5,
      });
      const resultado = await repository.adicionarPapel(1, NOME_PAPEL_CLIENT);
      expect(txMock.papel.create).not.toHaveBeenCalled();
      expect(txMock.papeisUsuario.create).toHaveBeenCalledWith({
        data: { usuarioId: 1, papelId: 5 },
      });
      expect(resultado).toEqual({ usuarioId: 1, papelId: 5 });
    });
    it('cria o papel quando não existe', async () => {
      txMock.papel.findFirst.mockResolvedValue(null);
      txMock.papel.create.mockResolvedValue({
        id: 9,
        nome: NOME_PAPEL_ORGANIZER,
      });
      txMock.papeisUsuario.create.mockResolvedValue({
        usuarioId: 1,
        papelId: 9,
      });
      await repository.adicionarPapel(1, NOME_PAPEL_ORGANIZER);
      expect(txMock.papel.create).toHaveBeenCalledWith({
        data: { nome: NOME_PAPEL_ORGANIZER },
      });
      expect(txMock.papeisUsuario.create).toHaveBeenCalledWith({
        data: { usuarioId: 1, papelId: 9 },
      });
    });
  });
  describe('findByIdComSenha', () => {
    it('retorna id e senha do usuário', async () => {
      prismaMock.usuario.findUnique.mockResolvedValue({
        id: 7,
        senha: 'hash',
      });
      const resultado = await repository.findByIdComSenha(7);
      expect(prismaMock.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
        select: { id: true, senha: true },
      });
      expect(resultado).toEqual({ id: 7, senha: 'hash' });
    });
  });
  describe('updateSenha', () => {
    it('atualiza a senha do usuário', async () => {
      prismaMock.usuario.update.mockResolvedValue({ id: 7 });
      const resultado = await repository.updateSenha(7, 'novo-hash');
      expect(prismaMock.usuario.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { senha: 'novo-hash' },
      });
      expect(resultado).toEqual({ id: 7 });
    });
  });
});
