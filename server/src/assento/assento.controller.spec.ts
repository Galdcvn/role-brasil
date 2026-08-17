import { AssentoController } from './assento.controller';
import { AssentoService } from './assento.service';

describe('AssentoController', () => {
  let controller: AssentoController;
  let serviceMock: { mapa: jest.Mock };

  beforeEach(() => {
    serviceMock = { mapa: jest.fn() };
    controller = new AssentoController(
      serviceMock as unknown as AssentoService,
    );
  });

  it('mapa delega com o sessaoId', async () => {
    serviceMock.mapa.mockResolvedValue([{ fileira: 'A', assentos: [] }]);
    const resultado = await controller.mapa(10);
    expect(serviceMock.mapa).toHaveBeenCalledWith(10);
    expect(resultado).toEqual([{ fileira: 'A', assentos: [] }]);
  });
});
