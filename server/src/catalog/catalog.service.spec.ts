import { CatalogService } from './catalog.service';
import { TmdbAdapter } from './providers/tmdb.adapter';

describe('CatalogService', () => {
  let service: CatalogService;
  let adapterMock: { search: jest.Mock; getById: jest.Mock };

  beforeEach(() => {
    adapterMock = { search: jest.fn(), getById: jest.fn() };
    service = new CatalogService(adapterMock as unknown as TmdbAdapter);
  });

  it('buscarFilmes delega para o adapter', async () => {
    adapterMock.search.mockResolvedValue([{ id: 1, titulo: 'Filme' }]);

    const resultado = await service.buscarFilmes('filme');

    expect(adapterMock.search).toHaveBeenCalledWith('filme');
    expect(resultado).toEqual([{ id: 1, titulo: 'Filme' }]);
  });

  it('detalharFilme delega para o adapter', async () => {
    adapterMock.getById.mockResolvedValue({ id: 1, titulo: 'Filme' });

    const resultado = await service.detalharFilme(1);

    expect(adapterMock.getById).toHaveBeenCalledWith(1);
    expect(resultado).toEqual({ id: 1, titulo: 'Filme' });
  });
});
