import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PagamentoRepository } from './pagamento.repository';
import { PagamentoService } from './pagamento.service';

describe('PagamentoService', () => {
  let service: PagamentoService;
  let repositoryMock: {
    buscarReservaPendente: jest.Mock;
    processarAprovado: jest.Mock;
    processarRecusado: jest.Mock;
  };

  beforeEach(() => {
    repositoryMock = {
      buscarReservaPendente: jest.fn(),
      processarAprovado: jest.fn(),
      processarRecusado: jest.fn(),
    };
    service = new PagamentoService(
      repositoryMock as unknown as PagamentoRepository,
    );
  });

  it('lança NotFound quando reserva não existe', async () => {
    repositoryMock.buscarReservaPendente.mockResolvedValue(null);
    await expect(
      service.processar({
        reservaId: 1,
        tipo: 'CARTAO',
        cartao: { nome: 'X', numero: '4242', validade: '12/30', cvv: '123' },
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('aprova pagamento via PIX', async () => {
    repositoryMock.buscarReservaPendente.mockResolvedValue({
      id: 1,
      subtotalCentavos: 2000,
    });
    repositoryMock.processarAprovado.mockResolvedValue({ ingressos: [] });
    const resultado = await service.processar({ reservaId: 1, tipo: 'PIX' });
    expect(resultado.status).toBe('APROVADO');
    expect(repositoryMock.processarAprovado).toHaveBeenCalledWith(
      1,
      2000,
      'PIX',
      undefined,
      expect.stringContaining('PIX') as string,
    );
  });

  it('rejeita cartão sem dados', async () => {
    repositoryMock.buscarReservaPendente.mockResolvedValue({
      id: 1,
      subtotalCentavos: 2000,
    });
    await expect(
      service.processar({ reservaId: 1, tipo: 'CARTAO' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('recusa pagamento quando CVV é 000', async () => {
    repositoryMock.buscarReservaPendente.mockResolvedValue({
      id: 1,
      subtotalCentavos: 2000,
    });
    repositoryMock.processarRecusado.mockResolvedValue({});
    const resultado = await service.processar({
      reservaId: 1,
      tipo: 'CARTAO',
      cartao: {
        nome: 'X',
        numero: '4242424242424242',
        validade: '12/30',
        cvv: '000',
      },
    });
    expect(resultado.status).toBe('RECUSADO');
    expect(repositoryMock.processarRecusado).toHaveBeenCalledWith(1);
    expect(repositoryMock.processarAprovado).not.toHaveBeenCalled();
  });

  it('aprova pagamento via cartão com CVV válido', async () => {
    repositoryMock.buscarReservaPendente.mockResolvedValue({
      id: 1,
      subtotalCentavos: 3000,
    });
    repositoryMock.processarAprovado.mockResolvedValue({ ingressos: [] });
    const resultado = await service.processar({
      reservaId: 1,
      tipo: 'CARTAO',
      cartao: {
        nome: 'X',
        numero: '4242424242424242',
        validade: '12/30',
        cvv: '123',
      },
    });
    expect(resultado.status).toBe('APROVADO');
    expect(repositoryMock.processarAprovado).toHaveBeenCalledWith(
      1,
      3000,
      'CARTAO',
      { finalCartao: '4242' },
    );
  });
});
