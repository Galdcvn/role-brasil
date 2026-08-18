import { StatsService } from './stats.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StatsService', () => {
  let service: StatsService;
  let prismaMock: {
    evento: { findMany: jest.Mock };
    reserva: { aggregate: jest.Mock };
    ingresso: { count: jest.Mock };
  };

  beforeEach(() => {
    prismaMock = {
      evento: { findMany: jest.fn() },
      reserva: { aggregate: jest.fn() },
      ingresso: { count: jest.fn() },
    };
    service = new StatsService(prismaMock as unknown as PrismaService);
  });

  it('retorna zeros quando organizador não tem eventos', async () => {
    prismaMock.evento.findMany.mockResolvedValue([]);

    const resultado = await service.buscarStats(1);

    expect(resultado).toEqual({
      totalEventos: 0,
      eventosPorStatus: {},
      totalReservas: 0,
      totalReceitaCentavos: 0,
      totalIngressos: 0,
    });
    expect(prismaMock.reserva.aggregate).not.toHaveBeenCalled();
    expect(prismaMock.ingresso.count).not.toHaveBeenCalled();
  });

  it('agrega métricas corretamente', async () => {
    prismaMock.evento.findMany.mockResolvedValue([
      { id: 1, status: 'PUBLICADO' },
      { id: 2, status: 'RASCUNHO' },
      { id: 3, status: 'PUBLICADO' },
    ]);
    prismaMock.reserva.aggregate.mockResolvedValue({
      _count: 42,
      _sum: { subtotalCentavos: 125000 },
    });
    prismaMock.ingresso.count.mockResolvedValue(38);

    const resultado = await service.buscarStats(1);

    expect(resultado.totalEventos).toBe(3);
    expect(resultado.eventosPorStatus).toEqual({ PUBLICADO: 2, RASCUNHO: 1 });
    expect(resultado.totalReservas).toBe(42);
    expect(resultado.totalReceitaCentavos).toBe(125000);
    expect(resultado.totalIngressos).toBe(38);
  });

  it('usa null do aggregate como zero', async () => {
    prismaMock.evento.findMany.mockResolvedValue([
      { id: 1, status: 'RASCUNHO' },
    ]);
    prismaMock.reserva.aggregate.mockResolvedValue({
      _count: 0,
      _sum: { subtotalCentavos: null },
    });
    prismaMock.ingresso.count.mockResolvedValue(0);

    const resultado = await service.buscarStats(1);

    expect(resultado.totalReceitaCentavos).toBe(0);
  });
});
