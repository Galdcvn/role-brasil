import { CriarReservaDto } from './criar-reserva.dto';

describe('CriarReservaDto', () => {
  it('é instanciável', () => {
    const dto = new CriarReservaDto();
    expect(dto).toBeInstanceOf(CriarReservaDto);
  });
});
