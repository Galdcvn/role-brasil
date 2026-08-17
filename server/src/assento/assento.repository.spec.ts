import { PrismaService } from '../prisma/prisma.service';
import { AssentoRepository } from './assento.repository';

describe('AssentoRepository', () => {
  let repository: AssentoRepository;
  let prismaMock: {
    assentosSessao: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prismaMock = {
      assentosSessao: { findMany: jest.fn() },
    };
    repository = new AssentoRepository(prismaMock as unknown as PrismaService);
  });

  it('listarPorSessao ordena por fileira e numero', async () => {
    prismaMock.assentosSessao.findMany.mockResolvedValue([
      { id: 1, fileira: 'A', numero: 1, status: 'DISPONIVEL' },
    ]);
    const resultado = await repository.listarPorSessao(10);
    expect(prismaMock.assentosSessao.findMany).toHaveBeenCalledWith({
      where: { sessaoId: 10 },
      orderBy: [{ fileira: 'asc' }, { numero: 'asc' }],
      select: { id: true, fileira: true, numero: true, status: true },
    });
    expect(resultado).toHaveLength(1);
  });

  it('buscarPorIds retorna os assentos pelos ids', async () => {
    prismaMock.assentosSessao.findMany.mockResolvedValue([{ id: 1 }]);
    const resultado = await repository.buscarPorIds([1, 2]);
    expect(prismaMock.assentosSessao.findMany).toHaveBeenCalledWith({
      where: { id: { in: [1, 2] } },
    });
    expect(resultado).toEqual([{ id: 1 }]);
  });
});
