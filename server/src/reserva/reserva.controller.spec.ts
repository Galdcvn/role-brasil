import { ReservaController } from './reserva.controller';
import { ReservaService } from './reserva.service';

describe('ReservaController', () => {
  let controller: ReservaController;
  let serviceMock: {
    criar: jest.Mock;
    listar: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = { criar: jest.fn(), listar: jest.fn() };
    controller = new ReservaController(
      serviceMock as unknown as ReservaService,
    );
  });

  const requisicao = { user: { sub: 7 } };

  it('criar delega com usuario e dto', async () => {
    serviceMock.criar.mockResolvedValue({ id: 1 });
    const dto = {
      sessaoId: 10,
      itens: [{ assentoSessaoId: 1, categoria: 'INTEIRA' }],
    };
    const resultado = await controller.criar(requisicao, dto as never);
    expect(serviceMock.criar).toHaveBeenCalledWith(7, dto);
    expect(resultado).toEqual({ id: 1 });
  });

  it('listar delega com o usuario', async () => {
    serviceMock.listar.mockResolvedValue([{ id: 1 }]);
    const resultado = await controller.listar(requisicao);
    expect(serviceMock.listar).toHaveBeenCalledWith(7);
    expect(resultado).toEqual([{ id: 1 }]);
  });
});
