import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

describe('StatsController', () => {
  let controller: StatsController;
  let serviceMock: { buscarStats: jest.Mock };

  beforeEach(() => {
    serviceMock = { buscarStats: jest.fn() };
    controller = new StatsController(serviceMock as unknown as StatsService);
  });

  it('chama buscarStats com o userId do request', async () => {
    serviceMock.buscarStats.mockResolvedValue({
      totalEventos: 2,
      eventosPorStatus: { PUBLICADO: 1, RASCUNHO: 1 },
      totalReservas: 10,
      totalReceitaCentavos: 50000,
      totalIngressos: 8,
    });

    const req = { user: { sub: 42 } };
    const resultado = await controller.buscarStats(req);

    expect(serviceMock.buscarStats).toHaveBeenCalledWith(42);
    expect(resultado.totalEventos).toBe(2);
  });
});
