import { PagamentoController } from './pagamento.controller';
import { PagamentoService } from './pagamento.service';

describe('PagamentoController', () => {
  let controller: PagamentoController;
  let serviceMock: { processar: jest.Mock };

  beforeEach(() => {
    serviceMock = { processar: jest.fn() };
    controller = new PagamentoController(
      serviceMock as unknown as PagamentoService,
    );
  });

  it('processar delega com o dto', async () => {
    serviceMock.processar.mockResolvedValue({ status: 'APROVADO' });
    const dto = { reservaId: 1, tipo: 'PIX' };
    const resultado = await controller.processar(dto as never);
    expect(serviceMock.processar).toHaveBeenCalledWith(dto);
    expect(resultado).toEqual({ status: 'APROVADO' });
  });
});
