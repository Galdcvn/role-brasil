import { PrismaService } from '../prisma/prisma.service';
import { FavoritoRepository } from './favorito.repository';

describe('FavoritoRepository', () => {
  let repository: FavoritoRepository;
  let prismaMock: {
    favorito: {
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      favorito: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };
    repository = new FavoritoRepository(prismaMock as unknown as PrismaService);
  });

  it('buscar devolve o favorito existente', async () => {
    prismaMock.favorito.findUnique.mockResolvedValue({ id: 1 });
    const resultado = await repository.buscar(7, 10);
    expect(prismaMock.favorito.findUnique).toHaveBeenCalledWith({
      where: { usuarioId_eventoId: { usuarioId: 7, eventoId: 10 } },
    });
    expect(resultado).toEqual({ id: 1 });
  });

  it('adicionar cria o registro', async () => {
    prismaMock.favorito.create.mockResolvedValue({ id: 1 });
    await repository.adicionar(7, 10);
    expect(prismaMock.favorito.create).toHaveBeenCalledWith({
      data: { usuarioId: 7, eventoId: 10 },
    });
  });

  it('remover apaga o registro', async () => {
    prismaMock.favorito.delete.mockResolvedValue({ id: 1 });
    await repository.remover(7, 10);
    expect(prismaMock.favorito.delete).toHaveBeenCalledWith({
      where: { usuarioId_eventoId: { usuarioId: 7, eventoId: 10 } },
    });
  });

  it('listarEventosIds retorna os registros com eventoId', async () => {
    prismaMock.favorito.findMany.mockResolvedValue([
      { eventoId: 10 },
      { eventoId: 20 },
    ]);
    const resultado = await repository.listarEventosIds(7);
    expect(prismaMock.favorito.findMany).toHaveBeenCalledWith({
      where: { usuarioId: 7 },
      select: { eventoId: true },
    });
    expect(resultado).toEqual([{ eventoId: 10 }, { eventoId: 20 }]);
  });
});
