import { PrismaService } from '../prisma/prisma.service';
import { SessaoRepository } from './sessao.repository';

describe('SessaoRepository', () => {
  let repository: SessaoRepository;
  let prismaMock: {
    evento: { findFirst: jest.Mock };
    sessaoEvento: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    assentosSessao: { createMany: jest.Mock };
    reserva: { count: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prismaMock = {
      evento: { findFirst: jest.fn() },
      sessaoEvento: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      assentosSessao: { createMany: jest.fn() },
      reserva: { count: jest.fn() },
      $transaction: jest.fn(),
    };
    repository = new SessaoRepository(prismaMock as unknown as PrismaService);
  });

  it('verificarEvento busca o evento ativo do organizador com status', async () => {
    prismaMock.evento.findFirst.mockResolvedValue({
      id: 3,
      status: 'PUBLICADO',
    });
    const resultado = await repository.verificarEvento(7, 3);
    expect(prismaMock.evento.findFirst).toHaveBeenCalledWith({
      where: { id: 3, organizadorId: 7, excluidoEm: null },
      select: { id: true, status: true },
    });
    expect(resultado).toEqual({ id: 3, status: 'PUBLICADO' });
  });

  it('criar cria a sessão com assentos via transação', async () => {
    const dataHora = new Date('2026-08-10T20:00:00Z');
    const sessaoCriada = { id: 1, eventoId: 3, dataHora };

    prismaMock.$transaction.mockImplementation(
      async (fn: (tx: PrismaService) => Promise<unknown>) => {
        return fn({
          sessaoEvento: {
            create: jest.fn().mockResolvedValue(sessaoCriada),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
          },
          assentosSessao: {
            createMany: jest.fn().mockResolvedValue({ count: 10 }),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
          },
          reserva: { count: jest.fn() },
          $transaction: jest.fn(),
        } as unknown as PrismaService);
      },
    );

    const resultado = await repository.criar(3, dataHora, 2, 5);
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(resultado).toEqual(sessaoCriada);
  });

  it('buscar lista sessões ativas do evento com contagem de reservas', async () => {
    prismaMock.sessaoEvento.findMany.mockResolvedValue([{ id: 1 }]);
    const resultado = await repository.buscar(3);
    expect(prismaMock.sessaoEvento.findMany).toHaveBeenCalledWith({
      where: { eventoId: 3, excluidoEm: null },
      orderBy: { dataHora: 'asc' },
      select: expect.objectContaining({
        _count: expect.any(Object) as object,
      }) as object,
    });
    expect(resultado).toEqual([{ id: 1 }]);
  });

  it('buscarPorId filtra sessões não excluídas', async () => {
    prismaMock.sessaoEvento.findFirst.mockResolvedValue({
      id: 5,
      eventoId: 3,
    });
    const resultado = await repository.buscarPorId(5);
    expect(prismaMock.sessaoEvento.findFirst).toHaveBeenCalledWith({
      where: { id: 5, excluidoEm: null },
      select: { id: true, eventoId: true },
    });
    expect(resultado).toEqual({ id: 5, eventoId: 3 });
  });

  it('atualizarData atualiza só a dataHora', async () => {
    const dataHora = new Date('2026-08-11T21:00:00Z');
    prismaMock.sessaoEvento.update.mockResolvedValue({ id: 1 });
    await repository.atualizarData(1, dataHora);
    expect(prismaMock.sessaoEvento.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { dataHora },
      select: expect.any(Object) as object,
    });
  });

  it('softDelete marca o excluidoEm', async () => {
    prismaMock.sessaoEvento.update.mockResolvedValue({ id: 1 });
    await repository.softDelete(1);
    expect(prismaMock.sessaoEvento.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        excluidoEm: expect.any(Date) as Date,
      }) as object,
      select: expect.any(Object) as object,
    });
  });

  it('cancelar marca a sessão como CANCELADA', async () => {
    prismaMock.sessaoEvento.update.mockResolvedValue({ id: 1 });
    await repository.cancelar(1);
    expect(prismaMock.sessaoEvento.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'CANCELADA' },
      select: expect.any(Object) as object,
    });
  });

  it('contarReservas conta as reservas da sessão', async () => {
    prismaMock.reserva.count.mockResolvedValue(2);
    const resultado = await repository.contarReservas(1);
    expect(prismaMock.reserva.count).toHaveBeenCalledWith({
      where: { sessaoId: 1 },
    });
    expect(resultado).toBe(2);
  });
});
