import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MensagemRepository } from './mensagem.repository';
import { MensagemService } from './mensagem.service';

describe('MensagemService', () => {
  let service: MensagemService;
  let repositoryMock: {
    criar: jest.Mock;
    verificarParticipacao: jest.Mock;
    verificarEventoExiste: jest.Mock;
    listarPorEvento: jest.Mock;
    marcarLida: jest.Mock;
    contarNaoLidas: jest.Mock;
  };

  beforeEach(() => {
    repositoryMock = {
      criar: jest.fn(),
      verificarParticipacao: jest.fn(),
      verificarEventoExiste: jest.fn(),
      listarPorEvento: jest.fn(),
      marcarLida: jest.fn(),
      contarNaoLidas: jest.fn(),
    };
    service = new MensagemService(
      repositoryMock as unknown as MensagemRepository,
    );
  });

  describe('enviar', () => {
    it('lança BadRequest quando mensagem vazia', async () => {
      await expect(service.enviar(7, 10, '   ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança NotFoundException quando evento não existe', async () => {
      repositoryMock.verificarEventoExiste.mockResolvedValue(null);
      await expect(service.enviar(7, 10, 'Olá')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança Forbidden quando usuário não participa', async () => {
      repositoryMock.verificarEventoExiste.mockResolvedValue({ id: 10 });
      repositoryMock.verificarParticipacao.mockResolvedValue(null);
      await expect(service.enviar(7, 10, 'Olá')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('cria mensagem quando participação é válida', async () => {
      repositoryMock.verificarEventoExiste.mockResolvedValue({ id: 10 });
      repositoryMock.verificarParticipacao.mockResolvedValue('CLIENTE');
      repositoryMock.criar.mockResolvedValue({ id: 1 });
      const resultado = await service.enviar(7, 10, 'Olá!');
      expect(repositoryMock.criar).toHaveBeenCalledWith(7, 10, 'Olá!');
      expect(resultado).toEqual({ id: 1 });
    });
  });

  describe('listarPorEvento', () => {
    it('lança NotFoundException quando evento não existe', async () => {
      repositoryMock.verificarEventoExiste.mockResolvedValue(null);
      await expect(service.listarPorEvento(7, 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança Forbidden quando usuário não participa', async () => {
      repositoryMock.verificarEventoExiste.mockResolvedValue({ id: 10 });
      repositoryMock.verificarParticipacao.mockResolvedValue(null);
      await expect(service.listarPorEvento(7, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('retorna mensagens quando participação é válida', async () => {
      repositoryMock.verificarEventoExiste.mockResolvedValue({ id: 10 });
      repositoryMock.verificarParticipacao.mockResolvedValue('ORGANIZER');
      repositoryMock.listarPorEvento.mockResolvedValue([{ id: 1 }]);
      const resultado = await service.listarPorEvento(7, 10);
      expect(resultado).toEqual([{ id: 1 }]);
    });
  });

  describe('marcarLida', () => {
    it('delega ao repository', async () => {
      repositoryMock.marcarLida.mockResolvedValue({ id: 1, lida: true });
      const resultado = await service.marcarLida(7, 1);
      expect(repositoryMock.marcarLida).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ id: 1, lida: true });
    });
  });

  describe('contarNaoLidas', () => {
    it('delega ao repository', async () => {
      repositoryMock.contarNaoLidas.mockResolvedValue([
        { eventoId: 10, naoLidas: 3 },
      ]);
      const resultado = await service.contarNaoLidas(7);
      expect(resultado).toEqual([{ eventoId: 10, naoLidas: 3 }]);
    });
  });
});
