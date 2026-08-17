import { PrismaService } from '../prisma/prisma.service';
import { MensagemRepository } from './mensagem.repository';

describe('MensagemRepository', () => {
  let repository: MensagemRepository;
  let prismaMock: {
    mensagem: {
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      groupBy: jest.Mock;
    };
    ingresso: { findFirst: jest.Mock; findMany: jest.Mock };
    evento: { findFirst: jest.Mock; findMany: jest.Mock };
  };

  beforeEach(() => {
    prismaMock = {
      mensagem: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        groupBy: jest.fn(),
      },
      ingresso: { findFirst: jest.fn(), findMany: jest.fn() },
      evento: { findFirst: jest.fn(), findMany: jest.fn() },
    };
    repository = new MensagemRepository(prismaMock as unknown as PrismaService);
  });

  it('criar cria a mensagem', async () => {
    prismaMock.mensagem.create.mockResolvedValue({ id: 1 });
    const resultado = await repository.criar(7, 10, 'Olá!');
    expect(prismaMock.mensagem.create).toHaveBeenCalledWith({
      data: { remetenteId: 7, eventoId: 10, conteudo: 'Olá!' },
    });
    expect(resultado).toEqual({ id: 1 });
  });

  it('verificarParticipacao retorna CLIENTE quando tem ingresso pago', async () => {
    prismaMock.ingresso.findFirst.mockResolvedValue({ id: 1 });
    const resultado = await repository.verificarParticipacao(7, 10);
    expect(resultado).toBe('CLIENTE');
  });

  it('verificarParticipacao retorna ORGANIZER quando é dono do evento', async () => {
    prismaMock.ingresso.findFirst.mockResolvedValue(null);
    prismaMock.evento.findFirst.mockResolvedValue({ id: 10 });
    const resultado = await repository.verificarParticipacao(7, 10);
    expect(resultado).toBe('ORGANIZER');
  });

  it('verificarParticipacao retorna null quando não participa', async () => {
    prismaMock.ingresso.findFirst.mockResolvedValue(null);
    prismaMock.evento.findFirst.mockResolvedValue(null);
    const resultado = await repository.verificarParticipacao(7, 10);
    expect(resultado).toBeNull();
  });

  it('verificarEventoExiste retorna null quando evento não existe', async () => {
    prismaMock.evento.findFirst.mockResolvedValue(null);
    const resultado = await repository.verificarEventoExiste(999);
    expect(resultado).toBeNull();
  });

  it('listarPorEvento retorna mensagens com remetente', async () => {
    prismaMock.mensagem.findMany.mockResolvedValue([{ id: 1, conteudo: 'Hi' }]);
    const resultado = await repository.listarPorEvento(10);
    expect(resultado).toEqual([{ id: 1, conteudo: 'Hi' }]);
  });

  it('marcarLida atualiza a mensagem', async () => {
    prismaMock.mensagem.update.mockResolvedValue({ id: 1, lida: true });
    await repository.marcarLida(1);
    expect(prismaMock.mensagem.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { lida: true },
    });
  });
});
