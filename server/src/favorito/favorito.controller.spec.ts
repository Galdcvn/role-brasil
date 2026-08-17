import { FavoritoController } from './favorito.controller';
import { FavoritoService } from './favorito.service';

describe('FavoritoController', () => {
  let controller: FavoritoController;
  let serviceMock: {
    toggle: jest.Mock;
    listar: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      toggle: jest.fn(),
      listar: jest.fn(),
    };
    controller = new FavoritoController(
      serviceMock as unknown as FavoritoService,
    );
  });

  const requisicao = { user: { sub: 7 } };

  it('toggle delega com usuario e eventoId', async () => {
    serviceMock.toggle.mockResolvedValue({ favoritado: true });
    const resultado = await controller.toggle(requisicao, 10);
    expect(serviceMock.toggle).toHaveBeenCalledWith(7, 10);
    expect(resultado).toEqual({ favoritado: true });
  });

  it('listar delega com o usuario', async () => {
    serviceMock.listar.mockResolvedValue([10, 20]);
    const resultado = await controller.listar(requisicao);
    expect(serviceMock.listar).toHaveBeenCalledWith(7);
    expect(resultado).toEqual([10, 20]);
  });
});
