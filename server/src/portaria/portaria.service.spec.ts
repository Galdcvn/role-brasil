import { ConflictException, NotFoundException } from '@nestjs/common';
import { PortariaRepository } from './portaria.repository';
import { PortariaService } from './portaria.service';

describe('PortariaService', () => {
  let service: PortariaService;
  let repositoryMock: {
    buscarPorCodigo: jest.Mock;
    buscarPorQrToken: jest.Mock;
    buscarPorId: jest.Mock;
    validarIngresso: jest.Mock;
    confirmarComprovante: jest.Mock;
    rejeitarComprovante: jest.Mock;
    registrarScan: jest.Mock;
    listarHistorico: jest.Mock;
    listarHistoricoPorEvento: jest.Mock;
  };

  const ingressoInteira = {
    id: 1,
    codigo: 'ABC123XYZ789DEFG',
    categoria: 'INTEIRA',
    status: 'EMITIDO',
    comprovanteStatus: 'NAO_NECESSARIO',
    reserva: {
      sessao: {
        evento: { id: 1, titulo: 'Show Teste' },
      },
    },
    assento: { fileira: 'A', numero: 1 },
    usuario: { nome: 'João' },
  };

  const ingressoMeia = {
    ...ingressoInteira,
    id: 2,
    categoria: 'MEIA',
  };

  beforeEach(() => {
    repositoryMock = {
      buscarPorCodigo: jest.fn(),
      buscarPorQrToken: jest.fn(),
      buscarPorId: jest.fn(),
      validarIngresso: jest.fn(),
      confirmarComprovante: jest.fn(),
      rejeitarComprovante: jest.fn(),
      registrarScan: jest.fn(),
      listarHistorico: jest.fn(),
      listarHistoricoPorEvento: jest.fn(),
    };
    service = new PortariaService(
      repositoryMock as unknown as PortariaRepository,
    );
  });

  describe('validar', () => {
    it('lança NotFoundException quando ingresso não existe', async () => {
      repositoryMock.buscarPorCodigo.mockResolvedValue(null);
      await expect(service.validar(7, { codigo: 'INVALIDO' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repositoryMock.registrarScan).toHaveBeenCalledWith({
        portariaId: 7,
        ingressoId: 0,
        resultado: 'REJEITADO',
        observacao: 'Ingresso não encontrado',
      });
    });

    it('lança ConflictException quando ingresso já foi usado', async () => {
      repositoryMock.buscarPorCodigo.mockResolvedValue({
        ...ingressoInteira,
        status: 'USADO',
      });
      await expect(
        service.validar(7, { codigo: 'ABC123XYZ789DEFG' }),
      ).rejects.toThrow(ConflictException);
      expect(repositoryMock.registrarScan).toHaveBeenCalledWith({
        portariaId: 7,
        ingressoId: 1,
        resultado: 'REJEITADO',
        observacao: 'Ingresso já utilizado',
      });
    });

    it('lança ConflictException quando ingresso está cancelado', async () => {
      repositoryMock.buscarPorCodigo.mockResolvedValue({
        ...ingressoInteira,
        status: 'CANCELADO',
      });
      await expect(
        service.validar(7, { codigo: 'ABC123XYZ789DEFG' }),
      ).rejects.toThrow(ConflictException);
      expect(repositoryMock.registrarScan).toHaveBeenCalledWith({
        portariaId: 7,
        ingressoId: 1,
        resultado: 'REJEITADO',
        observacao: 'Ingresso cancelado',
      });
    });

    it('retorna PENDENTE_DOCUMENTACAO para categoria MEIA', async () => {
      repositoryMock.buscarPorCodigo.mockResolvedValue(ingressoMeia);
      const resultado = await service.validar(7, {
        codigo: 'ABC123XYZ789DEFG',
      });
      expect(repositoryMock.registrarScan).toHaveBeenCalledWith({
        portariaId: 7,
        ingressoId: 2,
        resultado: 'PENDENTE_DOCUMENTACAO',
        observacao: 'Categoria MEIA — necessária verificação de documentação',
      });
      expect(repositoryMock.validarIngresso).not.toHaveBeenCalled();
      expect(resultado.status).toBe('PENDENTE_DOCUMENTACAO');
    });

    it('retorna PENDENTE_DOCUMENTACAO para categoria GRATUIDADE', async () => {
      repositoryMock.buscarPorCodigo.mockResolvedValue({
        ...ingressoMeia,
        categoria: 'GRATUIDADE',
      });
      const resultado = await service.validar(7, {
        codigo: 'ABC123XYZ789DEFG',
      });
      expect(resultado.status).toBe('PENDENTE_DOCUMENTACAO');
    });

    it('valida e aprova ingresso INTEIRA', async () => {
      repositoryMock.buscarPorCodigo.mockResolvedValue(ingressoInteira);
      repositoryMock.validarIngresso.mockResolvedValue({});
      repositoryMock.registrarScan.mockResolvedValue({});
      const resultado = await service.validar(7, {
        codigo: 'ABC123XYZ789DEFG',
      });
      expect(repositoryMock.validarIngresso).toHaveBeenCalledWith(1);
      expect(repositoryMock.registrarScan).toHaveBeenCalledWith({
        portariaId: 7,
        ingressoId: 1,
        resultado: 'APROVADO',
        observacao: 'Acesso liberado',
      });
      expect(resultado.status).toBe('APROVADO');
      expect(resultado.ingresso.evento).toBe('Show Teste');
    });

    it('lança ConflictException quando ingresso pertence a outro evento', async () => {
      repositoryMock.buscarPorCodigo.mockResolvedValue(ingressoInteira);
      await expect(
        service.validar(7, { codigo: 'ABC123XYZ789DEFG', eventoId: 99 }),
      ).rejects.toThrow(ConflictException);
      expect(repositoryMock.registrarScan).toHaveBeenCalledWith({
        portariaId: 7,
        ingressoId: 1,
        resultado: 'REJEITADO',
        observacao: 'Ingresso pertence a outro evento',
      });
    });
  });

  describe('confirmarComprovante', () => {
    it('lança NotFoundException quando ingresso não existe', async () => {
      repositoryMock.buscarPorId.mockResolvedValue(null);
      await expect(service.confirmarComprovante(7, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança ConflictException quando comprovante não está pendente', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        ...ingressoMeia,
        comprovanteStatus: 'NAO_NECESSARIO',
      });
      await expect(service.confirmarComprovante(7, 2)).rejects.toThrow(
        ConflictException,
      );
    });

    it('confirma comprovante e aprova', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        ...ingressoMeia,
        comprovanteStatus: 'PENDENTE',
      });
      repositoryMock.confirmarComprovante.mockResolvedValue({});
      repositoryMock.registrarScan.mockResolvedValue({});
      const resultado = await service.confirmarComprovante(7, 2);
      expect(repositoryMock.confirmarComprovante).toHaveBeenCalledWith(2);
      expect(repositoryMock.registrarScan).toHaveBeenCalledWith({
        portariaId: 7,
        ingressoId: 2,
        resultado: 'DOCUMENTACAO_CONFIRMADA',
        observacao: 'Documentação confirmada — acesso liberado',
      });
      expect(resultado.status).toBe('APROVADO');
    });
  });

  describe('rejeitarComprovante', () => {
    it('lança NotFoundException quando ingresso não existe', async () => {
      repositoryMock.buscarPorId.mockResolvedValue(null);
      await expect(service.rejeitarComprovante(7, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança ConflictException quando comprovante não está pendente', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        ...ingressoMeia,
        comprovanteStatus: 'CONFIRMADO',
      });
      await expect(service.rejeitarComprovante(7, 2)).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejeita comprovante', async () => {
      repositoryMock.buscarPorId.mockResolvedValue({
        ...ingressoMeia,
        comprovanteStatus: 'PENDENTE',
      });
      repositoryMock.rejeitarComprovante.mockResolvedValue({});
      repositoryMock.registrarScan.mockResolvedValue({});
      const resultado = await service.rejeitarComprovante(7, 2);
      expect(repositoryMock.rejeitarComprovante).toHaveBeenCalledWith(2);
      expect(repositoryMock.registrarScan).toHaveBeenCalledWith({
        portariaId: 7,
        ingressoId: 2,
        resultado: 'DOCUMENTACAO_RECUSADA',
        observacao: 'Documentação rejeitada',
      });
      expect(resultado.status).toBe('REJEITADO');
    });
  });

  describe('listarHistorico', () => {
    it('delega ao repository', async () => {
      repositoryMock.listarHistorico.mockResolvedValue([{ id: 1 }]);
      const resultado = await service.listarHistorico(7);
      expect(repositoryMock.listarHistorico).toHaveBeenCalledWith(7);
      expect(resultado).toEqual([{ id: 1 }]);
    });
  });

  describe('listarHistoricoPorEvento', () => {
    it('delega ao repository com eventoId', async () => {
      repositoryMock.listarHistoricoPorEvento.mockResolvedValue([{ id: 2 }]);
      const resultado = await service.listarHistoricoPorEvento(7, 1);
      expect(repositoryMock.listarHistoricoPorEvento).toHaveBeenCalledWith(
        7,
        1,
      );
      expect(resultado).toEqual([{ id: 2 }]);
    });
  });
});
