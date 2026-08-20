import { PrismaService } from '../prisma/prisma.service';
import { PagamentoRepository } from './pagamento.repository';

describe('PagamentoRepository', () => {
  let repository: PagamentoRepository;
  let txMock: {
    pagamento: { create: jest.Mock };
    reserva: { findFirst: jest.Mock; update: jest.Mock };
    assentosSessao: { update: jest.Mock };
    ingresso: { create: jest.Mock };
  };
  let prismaMock: {
    $transaction: jest.Mock;
    reserva: { findFirst: jest.Mock };
  };

  beforeEach(() => {
    txMock = {
      pagamento: { create: jest.fn() },
      reserva: { findFirst: jest.fn(), update: jest.fn() },
      assentosSessao: { update: jest.fn() },
      ingresso: { create: jest.fn() },
    };
    prismaMock = {
      $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
        fn(txMock),
      ),
      reserva: { findFirst: jest.fn() },
    };
    repository = new PagamentoRepository(
      prismaMock as unknown as PrismaService,
    );
  });

  it('buscarReservaPendente retorna a reserva com itens', async () => {
    prismaMock.reserva.findFirst.mockResolvedValue({
      id: 1,
      status: 'PENDENTE',
    });
    const resultado = await repository.buscarReservaPendente(1);
    expect(prismaMock.reserva.findFirst).toHaveBeenCalledWith({
      where: { id: 1, status: 'PENDENTE' },
      include: expect.objectContaining({
        itens: expect.any(Object) as object,
        sessao: expect.any(Object) as object,
      }) as object,
    });
    expect(resultado).toEqual({ id: 1, status: 'PENDENTE' });
  });

  it('processarAprovado cria pagamento, atualiza reserva e gera ingressos', async () => {
    txMock.reserva.findFirst.mockResolvedValue({
      id: 1,
      usuarioId: 7,
      subtotalCentavos: 2000,
      itens: [{ assentoSessaoId: 10, categoria: 'INTEIRA' }],
    });
    txMock.ingresso.create.mockResolvedValue({ id: 1 });

    const resultado = await repository.processarAprovado(1, 2000, 'CARTAO', {
      finalCartao: '4242',
    });

    expect(txMock.pagamento.create).toHaveBeenCalled();
    expect(txMock.reserva.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ status: 'PAGO' }) as object,
    });
    expect(txMock.assentosSessao.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: 'VENDIDO' },
    });
    expect(txMock.ingresso.create).toHaveBeenCalled();
    expect(resultado.reserva.id).toBe(1);
  });

  it('processarRecusado cancela reserva e libera assentos', async () => {
    txMock.reserva.findFirst.mockResolvedValue({
      id: 1,
      itens: [{ assentoSessaoId: 10 }],
    });

    await repository.processarRecusado(1);

    expect(txMock.reserva.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'CANCELADO' },
    });
    expect(txMock.assentosSessao.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: 'DISPONIVEL' },
    });
  });
});
