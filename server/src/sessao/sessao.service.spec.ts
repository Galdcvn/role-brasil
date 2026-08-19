import { ConflictException, NotFoundException } from '@nestjs/common';
import { AtualizarSessaoDto } from './dto/atualizar-sessao.dto';
import { CriarSessaoDto } from './dto/criar-sessao.dto';
import { SessaoRepository } from './sessao.repository';
import { SessaoService } from './sessao.service';

describe('SessaoService', () => {
  let service: SessaoService;
  let repositoryMock: {
    verificarEvento: jest.Mock;
    criar: jest.Mock;
    buscar: jest.Mock;
    buscarPorId: jest.Mock;
    atualizarData: jest.Mock;
    softDelete: jest.Mock;
    cancelar: jest.Mock;
    contarReservas: jest.Mock;
  };

  beforeEach(() => {
    repositoryMock = {
      verificarEvento: jest.fn(),
      criar: jest.fn(),
      buscar: jest.fn(),
      buscarPorId: jest.fn(),
      atualizarData: jest.fn(),
      softDelete: jest.fn(),
      cancelar: jest.fn(),
      contarReservas: jest.fn(),
    };
    service = new SessaoService(repositoryMock as unknown as SessaoRepository);
  });

  describe('criar', () => {
    it('cria a sessão quando o evento pertence ao organizador', async () => {
      repositoryMock.verificarEvento.mockResolvedValue({
        id: 3,
        status: 'RASCUNHO',
      });
      repositoryMock.criar.mockResolvedValue({ id: 1 });
      const dto = new CriarSessaoDto();
      dto.dataHora = '2026-08-10T20:00:00.000Z';
      dto.fileiras = 5;
      dto.assentosPorFileira = 20;
      const resultado = await service.criar(7, 3, dto);
      expect(repositoryMock.criar).toHaveBeenCalledWith(
        3,
        new Date('2026-08-10T20:00:00.000Z'),
        5,
        20,
      );
      expect(resultado).toEqual({ id: 1 });
    });

    it('lança NotFound quando o evento não é do organizador', async () => {
      repositoryMock.verificarEvento.mockResolvedValue(null);
      const dto = new CriarSessaoDto();
      dto.dataHora = '2026-08-10T20:00:00.000Z';
      await expect(service.criar(7, 3, dto)).rejects.toThrow(NotFoundException);
    });

    it('bloqueia sessões em evento cancelado', async () => {
      repositoryMock.verificarEvento.mockResolvedValue({
        id: 3,
        status: 'CANCELADO',
      });
      const dto = new CriarSessaoDto();
      dto.dataHora = '2026-08-10T20:00:00.000Z';
      await expect(service.criar(7, 3, dto)).rejects.toThrow(ConflictException);
      expect(repositoryMock.criar).not.toHaveBeenCalled();
    });
  });

  describe('listar', () => {
    it('lista as sessões do evento', async () => {
      repositoryMock.verificarEvento.mockResolvedValue({
        id: 3,
        status: 'PUBLICADO',
      });
      repositoryMock.buscar.mockResolvedValue([{ id: 1 }]);
      const resultado = await service.listar(7, 3);
      expect(repositoryMock.buscar).toHaveBeenCalledWith(3);
      expect(resultado).toEqual([{ id: 1 }]);
    });

    it('lança NotFound quando o evento não é do organizador', async () => {
      repositoryMock.verificarEvento.mockResolvedValue(null);
      await expect(service.listar(7, 3)).rejects.toThrow(NotFoundException);
    });
  });

  describe('atualizar', () => {
    it('atualiza a dataHora quando não há reservas', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        id: 1,
        eventoId: 3,
      });
      repositoryMock.verificarEvento.mockResolvedValue({
        id: 3,
        status: 'PUBLICADO',
      });
      repositoryMock.contarReservas.mockResolvedValue(0);
      repositoryMock.atualizarData.mockResolvedValue({ id: 1 });
      const dto = new AtualizarSessaoDto();
      dto.dataHora = '2026-08-12T19:30:00.000Z';
      const resultado = await service.atualizar(7, 1, dto);
      expect(repositoryMock.atualizarData).toHaveBeenCalledWith(
        1,
        new Date('2026-08-12T19:30:00.000Z'),
      );
      expect(resultado).toEqual({ id: 1 });
    });

    it('lança NotFound quando a sessão não existe', async () => {
      repositoryMock.buscarPorId.mockResolvedValue(null);
      const dto = new AtualizarSessaoDto();
      dto.dataHora = '2026-08-12T19:30:00.000Z';
      await expect(service.atualizar(7, 1, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança NotFound quando a sessão é de evento de outro organizador', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        id: 1,
        eventoId: 3,
      });
      repositoryMock.verificarEvento.mockResolvedValue(null);
      const dto = new AtualizarSessaoDto();
      dto.dataHora = '2026-08-12T19:30:00.000Z';
      await expect(service.atualizar(7, 1, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('bloqueia alteração quando há reservas', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        id: 1,
        eventoId: 3,
      });
      repositoryMock.verificarEvento.mockResolvedValue({
        id: 3,
        status: 'PUBLICADO',
      });
      repositoryMock.contarReservas.mockResolvedValue(1);
      const dto = new AtualizarSessaoDto();
      dto.dataHora = '2026-08-12T19:30:00.000Z';
      await expect(service.atualizar(7, 1, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(repositoryMock.atualizarData).not.toHaveBeenCalled();
    });
  });

  describe('excluir', () => {
    it('soft deleta quando não há reservas', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        id: 1,
        eventoId: 3,
      });
      repositoryMock.verificarEvento.mockResolvedValue({
        id: 3,
        status: 'PUBLICADO',
      });
      repositoryMock.contarReservas.mockResolvedValue(0);
      repositoryMock.softDelete.mockResolvedValue({ id: 1 });
      await service.excluir(7, 1);
      expect(repositoryMock.softDelete).toHaveBeenCalledWith(1);
    });

    it('bloqueia exclusão quando há reservas', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        id: 1,
        eventoId: 3,
      });
      repositoryMock.verificarEvento.mockResolvedValue({
        id: 3,
        status: 'PUBLICADO',
      });
      repositoryMock.contarReservas.mockResolvedValue(1);
      await expect(service.excluir(7, 1)).rejects.toThrow(ConflictException);
      expect(repositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it('lança NotFound quando a sessão não existe', async () => {
      repositoryMock.buscarPorId.mockResolvedValue(null);
      await expect(service.excluir(7, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelar', () => {
    it('cancela a sessão do organizador', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        id: 1,
        eventoId: 3,
      });
      repositoryMock.verificarEvento.mockResolvedValue({
        id: 3,
        status: 'PUBLICADO',
      });
      repositoryMock.cancelar.mockResolvedValue({ id: 1 });
      const resultado = await service.cancelar(7, 1);
      expect(repositoryMock.cancelar).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ id: 1 });
    });

    it('lança NotFound quando a sessão não existe', async () => {
      repositoryMock.buscarPorId.mockResolvedValue(null);
      await expect(service.cancelar(7, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
