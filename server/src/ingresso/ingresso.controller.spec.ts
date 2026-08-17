import { IngressoController } from './ingresso.controller';
import { IngressoService } from './ingresso.service';

describe('IngressoController', () => {
  let controller: IngressoController;
  let serviceMock: {
    listar: jest.Mock;
    detalhe: jest.Mock;
    cancelar: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      listar: jest.fn(),
      detalhe: jest.fn(),
      cancelar: jest.fn(),
    };
    controller = new IngressoController(
      serviceMock as unknown as IngressoService,
    );
  });

  const requisicao = { user: { sub: 7 } };

  it('listar delega com o usuario', async () => {
    serviceMock.listar.mockResolvedValue([{ id: 1 }]);
    const resultado = await controller.listar(requisicao);
    expect(serviceMock.listar).toHaveBeenCalledWith(7);
    expect(resultado).toEqual([{ id: 1 }]);
  });

  it('detalhe delega com usuario e id', async () => {
    serviceMock.detalhe.mockResolvedValue({ id: 1 });
    const resultado = await controller.detalhe(requisicao, 1);
    expect(serviceMock.detalhe).toHaveBeenCalledWith(7, 1);
    expect(resultado).toEqual({ id: 1 });
  });

  it('cancelar delega com usuario e id', async () => {
    serviceMock.cancelar.mockResolvedValue({ id: 1 });
    const resultado = await controller.cancelar(requisicao, 1);
    expect(serviceMock.cancelar).toHaveBeenCalledWith(7, 1);
    expect(resultado).toEqual({ id: 1 });
  });
});
