import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { IngressoRepository } from './ingresso.repository';
import { IngressoService } from './ingresso.service';

describe('IngressoService', () => {
  let service: IngressoService;
  let repositoryMock: {
    listarPorUsuario: jest.Mock;
    buscarPorId: jest.Mock;
    buscarPorCodigoPublico: jest.Mock;
    cancelar: jest.Mock;
  };

  beforeEach(() => {
    repositoryMock = {
      listarPorUsuario: jest.fn(),
      buscarPorId: jest.fn(),
      buscarPorCodigoPublico: jest.fn(),
      cancelar: jest.fn(),
    };
    service = new IngressoService(
      repositoryMock as unknown as IngressoRepository,
    );
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
    it('lança NotFound quando ingresso não existe', async () => {
      repositoryMock.buscarPorId.mockResolvedValue(null);
      await expect(service.detalhe(7, 1)).rejects.toThrow(NotFoundException);
    });

    it('lança NotFound quando ingresso é de outro usuário', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({ id: 1, usuarioId: 99 });
      await expect(service.detalhe(7, 1)).rejects.toThrow(NotFoundException);
    });

    it('retorna o ingresso quando ownership confere', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({ id: 1, usuarioId: 7 });
      const resultado = await service.detalhe(7, 1);
      expect(resultado).toEqual({ id: 1, usuarioId: 7 });
    });
  });

  describe('cancelar', () => {
    const ingressoFuturo = {
      id: 1,
      usuarioId: 7,
      status: 'EMITIDO',
      reserva: {
        sessao: {
          dataHora: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    };

    it('lança NotFound quando ingresso não existe', async () => {
      repositoryMock.buscarPorId.mockResolvedValue(null);
      await expect(service.cancelar(7, 1)).rejects.toThrow(NotFoundException);
    });

    it('lança Conflict quando ingresso já foi usado', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        ...ingressoFuturo,
        status: 'USADO',
      });
      await expect(service.cancelar(7, 1)).rejects.toThrow(ConflictException);
    });

    it('lança BadRequest quando faltam menos de 7 dias', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        ...ingressoFuturo,
        reserva: {
          sessao: {
            dataHora: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        },
      });
      await expect(service.cancelar(7, 1)).rejects.toThrow(BadRequestException);
    });

    it('cancela ingresso com mais de 7 dias', async () => {
      repositoryMock.buscarPorId.mockResolvedValue(ingressoFuturo);
      repositoryMock.cancelar.mockResolvedValue({ id: 1 });
      const resultado = await service.cancelar(7, 1);
      expect(repositoryMock.cancelar).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ id: 1 });
    });
  });

  describe('compartilhar', () => {
    it('lança NotFound quando código não existe', async () => {
      repositoryMock.buscarPorCodigoPublico.mockResolvedValue(null);
      await expect(service.compartilhar('INVALIDO')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna dados públicos com qrDataUrl quando código é válido', async () => {
      const ingressoFake = {
        codigo: 'ABC123',
        status: 'EMITIDO',
        categoria: 'PISTA',
      };
      repositoryMock.buscarPorCodigoPublico.mockResolvedValue(ingressoFake);
      const resultado = await service.compartilhar('ABC123');
      expect(resultado.codigo).toBe('ABC123');
      expect(resultado.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    });
  });
});
