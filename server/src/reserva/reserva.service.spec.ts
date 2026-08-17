import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AssentoRepository } from '../assento/assento.repository';
import { CriarReservaDto } from './dto/criar-reserva.dto';
import { ReservaRepository } from './reserva.repository';
import { ReservaService } from './reserva.service';

describe('ReservaService', () => {
  let service: ReservaService;
  let repositoryMock: {
    criar: jest.Mock;
    buscarPrecosCategoria: jest.Mock;
    buscarSessaoAtiva: jest.Mock;
    listarPorUsuario: jest.Mock;
    buscarPorId: jest.Mock;
    expirarReservas: jest.Mock;
  };
  let assentoRepositoryMock: {
    buscarPorIds: jest.Mock;
    listarPorSessao: jest.Mock;
  };

  beforeEach(() => {
    repositoryMock = {
      criar: jest.fn(),
      buscarPrecosCategoria: jest.fn(),
      buscarSessaoAtiva: jest.fn(),
      listarPorUsuario: jest.fn(),
      buscarPorId: jest.fn(),
      expirarReservas: jest.fn(),
    };
    assentoRepositoryMock = {
      buscarPorIds: jest.fn(),
      listarPorSessao: jest.fn(),
    };
    service = new ReservaService(
      repositoryMock as unknown as ReservaRepository,
      assentoRepositoryMock as unknown as AssentoRepository,
    );
  });

  describe('criar', () => {
    it('rejeita lista vazia', async () => {
      const dto = new CriarReservaDto();
      dto.sessaoId = 1;
      dto.itens = [];
      await expect(service.criar(7, dto)).rejects.toThrow(BadRequestException);
    });

    it('rejeita mais de10 itens', async () => {
      const dto = new CriarReservaDto();
      dto.sessaoId = 1;
      dto.itens = Array.from({ length: 11 }, (_, i) => ({
        assentoSessaoId: i + 1,
        categoria: 'INTEIRA' as const,
      }));
      await expect(service.criar(7, dto)).rejects.toThrow(BadRequestException);
    });

    it('rejeita sessão inválida', async () => {
      repositoryMock.buscarSessaoAtiva.mockResolvedValue(null);
      const dto = new CriarReservaDto();
      dto.sessaoId = 999;
      dto.itens = [{ assentoSessaoId: 1, categoria: 'INTEIRA' }];
      await expect(service.criar(7, dto)).rejects.toThrow(BadRequestException);
    });

    it('rejeita assento inexistente', async () => {
      repositoryMock.buscarSessaoAtiva.mockResolvedValue({ id: 10 });
      assentoRepositoryMock.buscarPorIds.mockResolvedValue([]);
      const dto = new CriarReservaDto();
      dto.sessaoId = 10;
      dto.itens = [{ assentoSessaoId: 1, categoria: 'INTEIRA' }];
      await expect(service.criar(7, dto)).rejects.toThrow(BadRequestException);
    });

    it('rejeita assento de outra sessão', async () => {
      repositoryMock.buscarSessaoAtiva.mockResolvedValue({ id: 10 });
      assentoRepositoryMock.buscarPorIds.mockResolvedValue([
        { id: 1, sessaoId: 99, status: 'DISPONIVEL' },
      ]);
      const dto = new CriarReservaDto();
      dto.sessaoId = 10;
      dto.itens = [{ assentoSessaoId: 1, categoria: 'INTEIRA' }];
      await expect(service.criar(7, dto)).rejects.toThrow(BadRequestException);
    });

    it('rejeita assento já ocupado', async () => {
      repositoryMock.buscarSessaoAtiva.mockResolvedValue({ id: 10 });
      assentoRepositoryMock.buscarPorIds.mockResolvedValue([
        { id: 1, sessaoId: 10, status: 'VENDIDO', fileira: 'A', numero: 1 },
      ]);
      const dto = new CriarReservaDto();
      dto.sessaoId = 10;
      dto.itens = [{ assentoSessaoId: 1, categoria: 'INTEIRA' }];
      await expect(service.criar(7, dto)).rejects.toThrow(ConflictException);
    });

    it('cria reserva com preços corretos', async () => {
      repositoryMock.buscarSessaoAtiva.mockResolvedValue({ id: 10 });
      assentoRepositoryMock.buscarPorIds.mockResolvedValue([
        { id: 1, sessaoId: 10, status: 'DISPONIVEL' },
      ]);
      repositoryMock.buscarPrecosCategoria.mockResolvedValue(
        new Map([['INTEIRA', 2000]]),
      );
      repositoryMock.criar.mockResolvedValue({ id: 1 });
      const dto = new CriarReservaDto();
      dto.sessaoId = 10;
      dto.itens = [{ assentoSessaoId: 1, categoria: 'INTEIRA' }];
      await service.criar(7, dto);
      expect(repositoryMock.criar).toHaveBeenCalledWith(7, 10, [
        { assentoSessaoId: 1, categoria: 'INTEIRA', precoCentavos: 2000 },
      ]);
    });
  });

  describe('listar', () => {
    it('repassa a listagem do repository', async () => {
      repositoryMock.listarPorUsuario.mockResolvedValue([{ id: 1 }]);
      const resultado = await service.listar(7);
      expect(repositoryMock.listarPorUsuario).toHaveBeenCalledWith(7);
      expect(resultado).toEqual([{ id: 1 }]);
    });
  });

  describe('detalhe', () => {
    it('lança NotFound quando reserva não existe', async () => {
      repositoryMock.buscarPorId.mockResolvedValue(null);
      await expect(service.detalhe(7, 1)).rejects.toThrow(NotFoundException);
    });

    it('lança NotFound quando reserva é de outro usuário', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({ id: 1, usuarioId: 99 });
      await expect(service.detalhe(7, 1)).rejects.toThrow(NotFoundException);
    });

    it('retorna a reserva quando ownership confere', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({ id: 1, usuarioId: 7 });
      const resultado = await service.detalhe(7, 1);
      expect(resultado).toEqual({ id: 1, usuarioId: 7 });
    });
  });

  describe('expirarReservas', () => {
    it('delega ao repository', async () => {
      repositoryMock.expirarReservas.mockResolvedValue(3);
      const resultado = await service.expirarReservas();
      expect(resultado).toBe(3);
    });
  });
});
