import { CriarPagamentoDto } from './criar-pagamento.dto';

describe('CriarPagamentoDto', () => {
  it('é instanciável', () => {
    const dto = new CriarPagamentoDto();
    expect(dto).toBeInstanceOf(CriarPagamentoDto);
  });
});
