import { AssentoRepository } from './assento.repository';
import { AssentoService } from './assento.service';

describe('AssentoService', () => {
  let service: AssentoService;
  let repositoryMock: {
    listarPorSessao: jest.Mock;
    buscarPorIds: jest.Mock;
  };

  beforeEach(() => {
    repositoryMock = {
      listarPorSessao: jest.fn(),
      buscarPorIds: jest.fn(),
    };
    service = new AssentoService(
      repositoryMock as unknown as AssentoRepository,
    );
  });

  describe('mapa', () => {
    it('agrupa assentos por fileira', async () => {
      repositoryMock.listarPorSessao.mockResolvedValue([
        { id: 1, fileira: 'A', numero: 1, status: 'DISPONIVEL' },
        { id: 2, fileira: 'A', numero: 2, status: 'VENDIDO' },
        { id: 3, fileira: 'B', numero: 1, status: 'RESERVADO' },
      ]);
      const resultado = await service.mapa(10);
      expect(resultado).toEqual([
        {
          fileira: 'A',
          assentos: [
            { id: 1, fileira: 'A', numero: 1, status: 'DISPONIVEL' },
            { id: 2, fileira: 'A', numero: 2, status: 'VENDIDO' },
          ],
        },
        {
          fileira: 'B',
          assentos: [{ id: 3, fileira: 'B', numero: 1, status: 'RESERVADO' }],
        },
      ]);
    });

    it('retorna array vazio quando não há assentos', async () => {
      repositoryMock.listarPorSessao.mockResolvedValue([]);
      const resultado = await service.mapa(10);
      expect(resultado).toEqual([]);
    });
  });

  it('buscarPorIds delega ao repository', async () => {
    repositoryMock.buscarPorIds.mockResolvedValue([{ id: 1 }]);
    const resultado = await service.buscarPorIds([1]);
    expect(repositoryMock.buscarPorIds).toHaveBeenCalledWith([1]);
    expect(resultado).toEqual([{ id: 1 }]);
  });
});
