import { PrismaService } from '../prisma/prisma.service';
import { ReservaRepository } from './reserva.repository';

describe('ReservaRepository', () => {
  let repository: ReservaRepository;
  let txMock: {
    assentosSessao: { update: jest.Mock };
    reserva: { create: jest.Mock; update: jest.Mock };
  };
  let prismaMock: {
    $transaction: jest.Mock;
    categoriasEvento: { findMany: jest.Mock };
    sessaoEvento: { findFirst: jest.Mock };
    reserva: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    txMock = {
      assentosSessao: { update: jest.fn() },
      reserva: { create: jest.fn(), update: jest.fn() },
    };
    prismaMock = {
      $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
        fn(txMock),
      ),
      categoriasEvento: { findMany: jest.fn() },
      sessaoEvento: { findFirst: jest.fn() },
      reserva: { findMany: jest.fn(), findUnique: jest.fn() },
    };
    repository = new ReservaRepository(prismaMock as unknown as PrismaService);
  });

  it('criar trava assentos e cria reserva na transação', async () => {
    txMock.reserva.create.mockResolvedValue({ id: 1 });
    const resultado = await repository.criar(7, 10, [
      { assentoSessaoId: 1, categoria: 'INTEIRA', precoCentavos: 2000 },
    ]);
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(txMock.assentosSessao.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'RESERVADO' },
    });
    expect(txMock.reserva.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          usuarioId: 7,
          sessaoId: 10,
          subtotalCentavos: 2000,
        }) as object,
      }) as object,
    );
    expect(resultado).toEqual({ id: 1 });
  });

  it('buscarPrecosCategoria retorna mapa de preços', async () => {
    prismaMock.categoriasEvento.findMany.mockResolvedValue([
      { nome: 'INTEIRA', precoCentavos: 2000 },
      { nome: 'MEIA', precoCentavos: 1000 },
    ]);
    const precos = await repository.buscarPrecosCategoria(10);
    expect(precos.get('INTEIRA')).toBe(2000);
    expect(precos.get('MEIA')).toBe(1000);
  });

  it('buscarSessaoAtiva retorna null para sessão inexistente', async () => {
    prismaMock.sessaoEvento.findFirst.mockResolvedValue(null);
    const resultado = await repository.buscarSessaoAtiva(999);
    expect(resultado).toBeNull();
  });

  it('expirarReservas retorna o número de reservas expiradas', async () => {
    prismaMock.reserva.findMany.mockResolvedValue([
      { id: 1, itens: [{ assentoSessaoId: 10 }] },
    ]);
    const resultado = await repository.expirarReservas();
    expect(txMock.reserva.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'EXPIRADO' },
    });
    expect(txMock.assentosSessao.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { status: 'DISPONIVEL' },
    });
    expect(resultado).toBe(1);
  });
});
