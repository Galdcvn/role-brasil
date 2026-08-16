import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { BuscarCatalogoDto } from './dto/buscar-catalogo.dto';

describe('CatalogController', () => {
  let controller: CatalogController;
  let serviceMock: { buscarFilmes: jest.Mock };

  beforeEach(() => {
    serviceMock = { buscarFilmes: jest.fn() };
    controller = new CatalogController(
      serviceMock as unknown as CatalogService,
    );
  });

  it('buscar repassa o termo de busca', async () => {
    const dto: BuscarCatalogoDto = { q: 'fight club' };
    serviceMock.buscarFilmes.mockResolvedValue([{ id: 1, titulo: 'Filme' }]);

    const resultado = await controller.buscar(dto);

    expect(serviceMock.buscarFilmes).toHaveBeenCalledWith('fight club');
    expect(resultado).toEqual([{ id: 1, titulo: 'Filme' }]);
  });
});
