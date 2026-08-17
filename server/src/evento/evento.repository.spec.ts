import { PrismaService } from '../prisma/prisma.service';
import { EventoRepository } from './evento.repository';

describe('EventoRepository', () => {
  let repository: EventoRepository;
  let txMock: {
    evento: { create: jest.Mock; update: jest.Mock };
    categoriasEvento: { deleteMany: jest.Mock };
    sessaoEvento: { updateMany: jest.Mock };
  };
  let prismaMock: {
    $transaction: jest.Mock;
    evento: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    reserva: { count: jest.Mock; findMany: jest.Mock };
  };

  beforeEach(() => {
    txMock = {
      evento: { create: jest.fn(), update: jest.fn() },
      categoriasEvento: { deleteMany: jest.fn() },
      sessaoEvento: { updateMany: jest.fn() },
    };
    prismaMock = {
      $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
        fn(txMock),
      ),
      evento: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      reserva: { count: jest.fn(), findMany: jest.fn() },
    };
    repository = new EventoRepository(prismaMock as unknown as PrismaService);
  });

  describe('criar', () => {
    it('cria o evento com categorias e sem endereço', async () => {
      txMock.evento.create.mockResolvedValue({ id: 1 });
      const resultado = await repository.criar(7, {
        tmdbId: 42,
        titulo: 'Filme A',
        categorias: [
          { nome: 'INTEIRA', precoCentavos: 2000 },
          { nome: 'MEIA', precoCentavos: 1000 },
        ],
      });
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(txMock.evento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizadorId: 7,
          tmdbId: 42,
          titulo: 'Filme A',
          categorias: {
            create: [
              { nome: 'INTEIRA', precoCentavos: 2000 },
              { nome: 'MEIA', precoCentavos: 1000 },
            ],
          },
        }) as object,
        select: expect.any(Object) as object,
      });
      const chamada = (
        txMock.evento.create.mock.calls as unknown as [[{ data: object }]]
      )[0];
      expect(chamada[0].data).not.toHaveProperty('endereco');
      expect(resultado).toEqual({ id: 1 });
    });

    it('cria o endereço aninhado quando informado', async () => {
      txMock.evento.create.mockResolvedValue({ id: 2 });
      await repository.criar(7, {
        titulo: 'Filme B',
        categorias: [{ nome: 'INTEIRA', precoCentavos: 2000 }],
        endereco: {
          cep: '01234567',
          rua: 'Rua X',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
        },
      });
      expect(txMock.evento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          endereco: {
            create: {
              cep: '01234567',
              rua: 'Rua X',
              bairro: 'Centro',
              cidade: 'São Paulo',
              estado: 'SP',
            },
          },
        }) as object,
        select: expect.any(Object) as object,
      });
    });
  });

  describe('consultas', () => {
    it('buscarDoOrganizador filtra por dono e excluídos e traz sessões ativas', async () => {
      prismaMock.evento.findFirst.mockResolvedValue({ id: 1 });
      const resultado = await repository.buscarDoOrganizador(7, 1);
      expect(prismaMock.evento.findFirst).toHaveBeenCalledWith({
        where: { id: 1, organizadorId: 7, excluidoEm: null },
        include: expect.objectContaining({
          endereco: true,
          categorias: expect.any(Object) as object,
          sessoes: expect.any(Object) as object,
        }) as object,
      });
      expect(resultado).toEqual({ id: 1 });
    });

    it('listarDoOrganizador lista só os não excluídos com contagem de sessões', async () => {
      prismaMock.evento.findMany.mockResolvedValue([{ id: 1 }]);
      const resultado = await repository.listarDoOrganizador(7);
      expect(prismaMock.evento.findMany).toHaveBeenCalledWith({
        where: { organizadorId: 7, excluidoEm: null },
        orderBy: { criadoEm: 'desc' },
        select: expect.objectContaining({
          _count: expect.any(Object) as object,
        }) as object,
      });
      expect(resultado).toEqual([{ id: 1 }]);
    });

    it('contarReservas conta todas as reservas do evento', async () => {
      prismaMock.reserva.count.mockResolvedValue(3);
      const resultado = await repository.contarReservas(1);
      expect(prismaMock.reserva.count).toHaveBeenCalledWith({
        where: { sessao: { eventoId: 1 } },
      });
      expect(resultado).toBe(3);
    });

    it('buscarReservas traz só os dados necessários às métricas', async () => {
      prismaMock.reserva.findMany.mockResolvedValue([{ sessaoId: 1 }]);
      const resultado = await repository.buscarReservas(1);
      expect(prismaMock.reserva.findMany).toHaveBeenCalledWith({
        where: { sessao: { eventoId: 1 } },
        select: expect.objectContaining({
          ingressos: expect.any(Object) as object,
        }) as object,
      });
      expect(resultado).toEqual([{ sessaoId: 1 }]);
    });
  });

  describe('atualizar', () => {
    it('atualiza os campos enviados sem tocar nos demais', async () => {
      txMock.evento.update.mockResolvedValue({ id: 1 });
      await repository.atualizar(1, {
        titulo: 'Novo Título',
        descricao: 'Nova descrição',
      });
      expect(txMock.evento.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          titulo: 'Novo Título',
          descricao: 'Nova descrição',
        },
        select: expect.any(Object) as object,
      });
    });

    it('substitui categorias quando enviadas', async () => {
      txMock.evento.update.mockResolvedValue({ id: 1 });
      await repository.atualizar(1, {
        categorias: [{ nome: 'MEIA', precoCentavos: 1000 }],
      });
      expect(txMock.categoriasEvento.deleteMany).toHaveBeenCalledWith({
        where: { eventoId: 1 },
      });
      expect(txMock.evento.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          categorias: {
            create: [{ nome: 'MEIA', precoCentavos: 1000 }],
          },
        }) as object,
        select: expect.any(Object) as object,
      });
    });

    it('faz upsert do endereço quando enviado', async () => {
      txMock.evento.update.mockResolvedValue({ id: 1 });
      await repository.atualizar(1, {
        endereco: {
          cep: '01234567',
          rua: 'Rua X',
          bairro: 'B',
          cidade: 'C',
          estado: 'SP',
        },
      });
      expect(txMock.evento.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          endereco: {
            upsert: {
              create: expect.any(Object) as object,
              update: expect.any(Object) as object,
            },
          },
        }) as object,
        select: expect.any(Object) as object,
      });
    });
  });

  describe('estados do evento', () => {
    it('softDelete marca o excluídoEm', async () => {
      prismaMock.evento.update.mockResolvedValue({ id: 1 });
      await repository.softDelete(1);
      expect(prismaMock.evento.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          excluidoEm: expect.any(Date) as Date,
        }) as object,
        select: expect.any(Object) as object,
      });
    });

    it('cancelar cancela as sessões ativas e o evento', async () => {
      txMock.evento.update.mockResolvedValue({ id: 1 });
      await repository.cancelar(1);
      expect(txMock.sessaoEvento.updateMany).toHaveBeenCalledWith({
        where: { eventoId: 1, status: 'ATIVA' },
        data: { status: 'CANCELADA' },
      });
      expect(txMock.evento.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'CANCELADO' },
        select: expect.any(Object) as object,
      });
    });

    it('publicar marca o evento como PUBLICADO', async () => {
      prismaMock.evento.update.mockResolvedValue({ id: 1 });
      await repository.publicar(1);
      expect(prismaMock.evento.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'PUBLICADO' },
        select: expect.any(Object) as object,
      });
    });
  });

  describe('listarPublicos', () => {
    it('retorna eventos publicados com paginação', async () => {
      prismaMock.evento.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.evento.count.mockResolvedValue(1);
      const resultado = await repository.listarPublicos({ page: 1, limit: 10 });
      expect(prismaMock.evento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PUBLICADO' }) as object,
          skip: 0,
          take: 10,
        }) as object,
      );
      expect(prismaMock.evento.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ status: 'PUBLICADO' }) as object,
      });
      expect(resultado).toEqual({
        eventos: [{ id: 1 }],
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('aplica filtro de busca por titulo', async () => {
      prismaMock.evento.findMany.mockResolvedValue([]);
      prismaMock.evento.count.mockResolvedValue(0);
      await repository.listarPublicos({ busca: 'rock' });
      expect(prismaMock.evento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            titulo: { contains: 'rock', mode: 'insensitive' },
          }) as object,
        }) as object,
      );
    });

    it('aplica filtro de preço', async () => {
      prismaMock.evento.findMany.mockResolvedValue([]);
      prismaMock.evento.count.mockResolvedValue(0);
      await repository.listarPublicos({ precoMin: 1000, precoMax: 5000 });
      expect(prismaMock.evento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categorias: {
              some: { precoCentavos: { gte: 1000, lte: 5000 } },
            },
          }) as object,
        }) as object,
      );
    });
  });

  describe('buscarPublico', () => {
    it('retorna null quando evento não existe', async () => {
      prismaMock.evento.findFirst.mockResolvedValue(null);
      const resultado = await repository.buscarPublico(999);
      expect(resultado).toBeNull();
    });

    it('retorna evento com sessões e vagas', async () => {
      prismaMock.evento.findFirst.mockResolvedValue({
        id: 1,
        titulo: 'Festa',
        endereco: { cidade: 'SP' },
        categorias: [{ nome: 'INTEIRA', precoCentavos: 2000 }],
        sessoes: [{ id: 10, dataHora: new Date(), _count: { assentos: 50 } }],
      });
      const resultado = await repository.buscarPublico(1);
      expect(resultado).toEqual(
        expect.objectContaining({
          id: 1,
          titulo: 'Festa',
          sessoes: [
            {
              id: 10,
              dataHora: expect.any(Date) as Date,
              vagasDisponiveis: 50,
            },
          ],
        }) as object,
      );
    });
  });
});
