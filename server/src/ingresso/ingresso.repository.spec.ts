import { PrismaService } from '../prisma/prisma.service';
import { IngressoRepository } from './ingresso.repository';

describe('IngressoRepository', () => {
  let repository: IngressoRepository;
  let txMock: {
    ingresso: { findUniqueOrThrow: jest.Mock; update: jest.Mock };
    assentosSessao: { update: jest.Mock };
    pagamento: { findFirst: jest.Mock; update: jest.Mock };
    reserva: { update: jest.Mock };
  };
  let prismaMock: {
    $transaction: jest.Mock;
    ingresso: { findMany: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(() => {
    txMock = {
      ingresso: { findUniqueOrThrow: jest.fn(), update: jest.fn() },
      assentosSessao: { update: jest.fn() },
      pagamento: { findFirst: jest.fn(), update: jest.fn() },
      reserva: { update: jest.fn() },
    };
    prismaMock = {
      $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
        fn(txMock),
      ),
      ingresso: { findMany: jest.fn(), findUnique: jest.fn() },
    };
    repository = new IngressoRepository(prismaMock as unknown as PrismaService);
  });

  it('listarPorUsuario retorna ingressos com reserva e assento', async () => {
    prismaMock.ingresso.findMany.mockResolvedValue([{ id: 1 }]);
    const resultado = await repository.listarPorUsuario(7);
    expect(prismaMock.ingresso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { usuarioId: 7 },
      }) as object,
    );
    expect(resultado).toEqual([{ id: 1 }]);
  });

  it('buscarPorId retorna null quando não existe', async () => {
    prismaMock.ingresso.findUnique.mockResolvedValue(null);
    const resultado = await repository.buscarPorId(999);
    expect(resultado).toBeNull();
  });

  it('cancelar atualiza status do ingresso e libera assento', async () => {
    txMock.ingresso.findUniqueOrThrow.mockResolvedValue({
      id: 1,
      assentoSessaoId: 10,
      reservaId: 5,
    });
    txMock.pagamento.findFirst.mockResolvedValue({ id: 20 });
    await repository.cancelar(1);
    expect(txMock.ingresso.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'CANCELADO' },
    });
    expect(txMock.assentosSessao.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: 'DISPONIVEL' },
    });
    expect(txMock.pagamento.update).toHaveBeenCalledWith({
      where: { id: 20 },
      data: { status: 'ESTORNADO' },
    });
    expect(txMock.reserva.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { status: 'CANCELADO' },
    });
  });
});
