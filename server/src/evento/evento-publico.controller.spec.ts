import { EventoPublicoController } from './evento-publico.controller';
import { EventoService } from './evento.service';

describe('EventoPublicoController', () => {
  let controller: EventoPublicoController;
  let serviceMock: {
    listarPublicos: jest.Mock;
    detalhePublico: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      listarPublicos: jest.fn(),
      detalhePublico: jest.fn(),
    };
    controller = new EventoPublicoController(
      serviceMock as unknown as EventoService,
    );
  });

  it('listar delega com os filtros recebidos', async () => {
    serviceMock.listarPublicos.mockResolvedValue({ eventos: [], total: 0 });
    const filtros = { busca: 'festa', page: 1 };
    const resultado = await controller.listar(filtros);
    expect(serviceMock.listarPublicos).toHaveBeenCalledWith(filtros);
    expect(resultado).toEqual({ eventos: [], total: 0 });
  });

  it('detalhe delega com o id do evento', async () => {
    serviceMock.detalhePublico.mockResolvedValue({ id: 1, titulo: 'X' });
    const resultado = await controller.detalhe(1);
    expect(serviceMock.detalhePublico).toHaveBeenCalledWith(1);
    expect(resultado).toEqual({ id: 1, titulo: 'X' });
  });
});
