import { FavoritoRepository } from './favorito.repository';
import { FavoritoService } from './favorito.service';

describe('FavoritoService', () => {
  let service: FavoritoService;
  let repositoryMock: {
    buscar: jest.Mock;
    adicionar: jest.Mock;
    remover: jest.Mock;
    listarEventosIds: jest.Mock;
  };

  beforeEach(() => {
    repositoryMock = {
      buscar: jest.fn(),
      adicionar: jest.fn(),
      remover: jest.fn(),
      listarEventosIds: jest.fn(),
    };
    service = new FavoritoService(
      repositoryMock as unknown as FavoritoRepository,
    );
  });

  describe('toggle', () => {
    it('remove o favorito quando já existe', async () => {
      repositoryMock.buscar.mockResolvedValue({ id: 1 });
      const resultado = await service.toggle(7, 10);
      expect(repositoryMock.remover).toHaveBeenCalledWith(7, 10);
      expect(resultado).toEqual({ favoritado: false });
    });

    it('adiciona o favorito quando não existe', async () => {
      repositoryMock.buscar.mockResolvedValue(null);
      repositoryMock.adicionar.mockResolvedValue({ id: 1 });
      const resultado = await service.toggle(7, 10);
      expect(repositoryMock.adicionar).toHaveBeenCalledWith(7, 10);
      expect(resultado).toEqual({ favoritado: true });
    });
  });

  describe('listar', () => {
    it('retorna array de ids dos eventos favoritados', async () => {
      repositoryMock.listarEventosIds.mockResolvedValue([
        { eventoId: 10 },
        { eventoId: 20 },
      ]);
      const resultado = await service.listar(7);
      expect(resultado).toEqual([10, 20]);
    });
  });
});
