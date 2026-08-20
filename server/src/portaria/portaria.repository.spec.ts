import { PrismaService } from '../prisma/prisma.service';
import { PortariaRepository } from './portaria.repository';

describe('PortariaRepository', () => {
  let repository: PortariaRepository;
  let prismaMock: {
    ingresso: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    portariaScan: { create: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const ingressoBase = {
    id: 1,
    reservaId: 10,
    assentoSessaoId: 100,
    usuarioId: 7,
    categoria: 'INTEIRA',
    codigo: 'ABC123XYZ789DEFG',
    qrToken: 'a'.repeat(32),
    status: 'EMITIDO',
    usadoEm: null,
    comprovanteStatus: 'NAO_NECESSARIO',
    criadoEm: new Date(),
    reserva: {
      id: 10,
      sessao: {
        id: 50,
        dataHora: new Date(),
        evento: {
          id: 1,
          titulo: 'Show',
          posterUrl: null,
          status: 'PUBLICADO',
        },
      },
    },
    assento: { fileira: 'A', numero: 1 },
    usuario: { id: 7, nome: 'João', email: 'joao@test.com' },
  };

  beforeEach(() => {
    prismaMock = {
      ingresso: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      portariaScan: { create: jest.fn(), findMany: jest.fn() },
      $transaction: jest.fn((cb: (tx: typeof prismaMock) => Promise<unknown>) =>
        cb({
          ingresso: prismaMock.ingresso,
          portariaScan: prismaMock.portariaScan,
          $transaction: prismaMock.$transaction,
        }),
      ),
    };
    repository = new PortariaRepository(prismaMock as unknown as PrismaService);
  });

  it('buscarPorCodigo retorna ingresso', async () => {
    prismaMock.ingresso.findUnique.mockResolvedValue(ingressoBase);
    const resultado = await repository.buscarPorCodigo('ABC123XYZ789DEFG');
    expect(prismaMock.ingresso.findUnique).toHaveBeenCalledWith({
      where: { codigo: 'ABC123XYZ789DEFG' },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      include: expect.any(Object),
    });
    expect(resultado).toEqual(ingressoBase);
  });

  it('buscarPorQrToken retorna ingresso', async () => {
    prismaMock.ingresso.findFirst.mockResolvedValue(ingressoBase);
    const resultado = await repository.buscarPorQrToken('a'.repeat(32));
    expect(prismaMock.ingresso.findFirst).toHaveBeenCalledWith({
      where: { qrToken: 'a'.repeat(32) },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      include: expect.any(Object),
    });
    expect(resultado).toEqual(ingressoBase);
  });

  it('buscarPorId retorna ingresso', async () => {
    prismaMock.ingresso.findUnique.mockResolvedValue(ingressoBase);
    const resultado = await repository.buscarPorId(1);
    expect(prismaMock.ingresso.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      include: expect.any(Object),
    });
    expect(resultado).toEqual(ingressoBase);
  });

  it('validarIngresso marca como USADO', async () => {
    prismaMock.ingresso.update.mockResolvedValue({});
    await repository.validarIngresso(1);
    expect(prismaMock.ingresso.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        status: 'USADO',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        usadoEm: expect.any(Date),
      },
    });
  });

  it('confirmarComprovante marca como CONFIRMADO e USADO', async () => {
    prismaMock.ingresso.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.ingresso.update.mockResolvedValue({});
    await repository.confirmarComprovante(1);
    expect(prismaMock.ingresso.findFirst).toHaveBeenCalledWith({
      where: { id: 1, comprovanteStatus: 'PENDENTE' },
      select: { id: true },
    });
    expect(prismaMock.ingresso.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        comprovanteStatus: 'CONFIRMADO',
        status: 'USADO',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        usadoEm: expect.any(Date),
      },
    });
  });

  it('rejeitarComprovante marca como RECUSADO', async () => {
    prismaMock.ingresso.findFirst.mockResolvedValue({ id: 1 });
    prismaMock.ingresso.update.mockResolvedValue({});
    await repository.rejeitarComprovante(1);
    expect(prismaMock.ingresso.findFirst).toHaveBeenCalledWith({
      where: { id: 1, comprovanteStatus: 'PENDENTE' },
      select: { id: true },
    });
    expect(prismaMock.ingresso.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { comprovanteStatus: 'RECUSADO', status: 'CANCELADO' },
    });
  });

  it('registrarScan cria registro', async () => {
    prismaMock.portariaScan.create.mockResolvedValue({ id: 1 });
    const resultado = await repository.registrarScan({
      portariaId: 7,
      ingressoId: 1,
      resultado: 'APROVADO',
      observacao: 'Teste',
    });
    expect(prismaMock.portariaScan.create).toHaveBeenCalledWith({
      data: {
        portariaId: 7,
        ingressoId: 1,
        resultado: 'APROVADO',
        observacao: 'Teste',
      },
    });
    expect(resultado).toEqual({ id: 1 });
  });

  it('listarHistorico retorna scans do portaria', async () => {
    prismaMock.portariaScan.findMany.mockResolvedValue([{ id: 1 }]);
    const resultado = await repository.listarHistorico(7);
    expect(prismaMock.portariaScan.findMany).toHaveBeenCalledWith({
      where: { portariaId: 7 },
      orderBy: { criadoEm: 'desc' },
      include: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ingresso: expect.any(Object),
      },
    });
    expect(resultado).toEqual([{ id: 1 }]);
  });

  it('listarHistoricoPorEvento filtra por eventoId', async () => {
    prismaMock.portariaScan.findMany.mockResolvedValue([{ id: 2 }]);
    const resultado = await repository.listarHistoricoPorEvento(7, 1);
    expect(prismaMock.portariaScan.findMany).toHaveBeenCalledWith({
      where: {
        portariaId: 7,
        ingresso: { reserva: { sessao: { eventoId: 1 } } },
      },
      orderBy: { criadoEm: 'desc' },
      include: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ingresso: expect.any(Object),
      },
    });
    expect(resultado).toEqual([{ id: 2 }]);
  });
});
