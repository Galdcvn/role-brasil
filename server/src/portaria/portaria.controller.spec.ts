import { PortariaService } from './portaria.service';
import { PortariaController } from './portaria.controller';

describe('PortariaController', () => {
  let controller: PortariaController;
  let serviceMock: {
    validar: jest.Mock;
    confirmarComprovante: jest.Mock;
    rejeitarComprovante: jest.Mock;
    listarHistorico: jest.Mock;
    listarHistoricoPorEvento: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      validar: jest.fn(),
      confirmarComprovante: jest.fn(),
      rejeitarComprovante: jest.fn(),
      listarHistorico: jest.fn(),
      listarHistoricoPorEvento: jest.fn(),
    };
    controller = new PortariaController(
      serviceMock as unknown as PortariaService,
    );
  });

  const req = { user: { sub: 7 } };

  it('validar delega ao service', async () => {
    serviceMock.validar.mockResolvedValue({ status: 'APROVADO' });
    const resultado = await controller.validar(req, { codigo: 'ABC123' });
    expect(serviceMock.validar).toHaveBeenCalledWith(7, { codigo: 'ABC123' });
    expect(resultado).toEqual({ status: 'APROVADO' });
  });

  it('confirmarComprovante delega ao service', async () => {
    serviceMock.confirmarComprovante.mockResolvedValue({
      status: 'APROVADO',
    });
    const resultado = await controller.confirmarComprovante(req, 2);
    expect(serviceMock.confirmarComprovante).toHaveBeenCalledWith(7, 2);
    expect(resultado).toEqual({ status: 'APROVADO' });
  });

  it('rejeitarComprovante delega ao service', async () => {
    serviceMock.rejeitarComprovante.mockResolvedValue({
      status: 'REJEITADO',
    });
    const resultado = await controller.rejeitarComprovante(req, 2);
    expect(serviceMock.rejeitarComprovante).toHaveBeenCalledWith(7, 2);
    expect(resultado).toEqual({ status: 'REJEITADO' });
  });

  it('historico delega ao service', async () => {
    serviceMock.listarHistorico.mockResolvedValue([{ id: 1 }]);
    const resultado = await controller.historico(req);
    expect(serviceMock.listarHistorico).toHaveBeenCalledWith(7);
    expect(resultado).toEqual([{ id: 1 }]);
  });

  it('historicoPorEvento delega ao service', async () => {
    serviceMock.listarHistoricoPorEvento.mockResolvedValue([{ id: 2 }]);
    const resultado = await controller.historicoPorEvento(req, 1);
    expect(serviceMock.listarHistoricoPorEvento).toHaveBeenCalledWith(7, 1);
    expect(resultado).toEqual([{ id: 2 }]);
  });
});
