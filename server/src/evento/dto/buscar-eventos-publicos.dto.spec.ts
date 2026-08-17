import { BuscarEventosDto } from './buscar-eventos-publicos.dto';

describe('BuscarEventosDto', () => {
  it('é instanciável com valores padrão', () => {
    const dto = new BuscarEventosDto();
    expect(dto).toBeInstanceOf(BuscarEventosDto);
    expect(dto.busca).toBeUndefined();
    expect(dto.page).toBeUndefined();
  });
});
