import { MensagemGlobalController } from './mensagem-global.controller';
import { MensagemService } from './mensagem.service';

describe('MensagemGlobalController', () => {
  let controller: MensagemGlobalController;
  let serviceMock: {
    contarNaoLidas: jest.Mock;
    marcarLida: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      contarNaoLidas: jest.fn(),
      marcarLida: jest.fn(),
    };
    controller = new MensagemGlobalController(
      serviceMock as unknown as MensagemService,
    );
  });

  describe('contarNaoLidas', () => {
    it('delega ao service com o usuarioId do request', async () => {
      serviceMock.contarNaoLidas.mockResolvedValue([
        { eventoId: 10, naoLidas: 3 },
      ]);
      const requisicao = { user: { sub: 7 } };
      const resultado = await controller.contarNaoLidas(requisicao);
      expect(serviceMock.contarNaoLidas).toHaveBeenCalledWith(7);
      expect(resultado).toEqual([{ eventoId: 10, naoLidas: 3 }]);
    });
  });

  describe('marcarLida', () => {
    it('delega ao service com os parâmetros corretos', async () => {
      serviceMock.marcarLida.mockResolvedValue({ id: 1, lida: true });
      const requisicao = { user: { sub: 7 } };
      const resultado = await controller.marcarLida(requisicao, 1);
      expect(serviceMock.marcarLida).toHaveBeenCalledWith(7, 1);
      expect(resultado).toEqual({ id: 1, lida: true });
    });
  });
});
