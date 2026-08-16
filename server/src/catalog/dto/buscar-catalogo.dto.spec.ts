import { BuscarCatalogoDto } from './buscar-catalogo.dto';

describe('BuscarCatalogoDto', () => {
  it('cria uma instância com o termo preenchido', () => {
    const dto = new BuscarCatalogoDto();
    dto.q = 'filme';

    expect(dto).toBeInstanceOf(BuscarCatalogoDto);
    expect(dto.q).toBe('filme');
  });
});
