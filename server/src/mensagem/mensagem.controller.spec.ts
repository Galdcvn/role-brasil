import { MensagemController } from './mensagem.controller';
import { MensagemService } from './mensagem.service';

describe('MensagemController', () => {
  let controller: MensagemController;
  let serviceMock: {
    enviar: jest.Mock;
    listarPorEvento: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      enviar: jest.fn(),
      listarPorEvento: jest.fn(),
    };
    controller = new MensagemController(
      serviceMock as unknown as MensagemService,
    );
  });

  describe('enviar', () => {
    it('delega ao service com os parâmetros corretos', async () => {
      serviceMock.enviar.mockResolvedValue({ id: 1 });
      const requisicao = { user: { sub: 7 } };
      const resultado = await controller.enviar(requisicao, 10, {
        conteudo: 'Olá!',
      });
      expect(serviceMock.enviar).toHaveBeenCalledWith(7, 10, 'Olá!');
      expect(resultado).toEqual({ id: 1 });
    });
  });

  describe('listar', () => {
    it('delega ao service com os parâmetros corretos', async () => {
      serviceMock.listarPorEvento.mockResolvedValue([{ id: 1 }]);
      const requisicao = { user: { sub: 7 } };
      const resultado = await controller.listar(requisicao, 10);
      expect(serviceMock.listarPorEvento).toHaveBeenCalledWith(7, 10);
      expect(resultado).toEqual([{ id: 1 }]);
    });
  });
});
