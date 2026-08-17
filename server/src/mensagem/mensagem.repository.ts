import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MensagemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(remetenteId: number, eventoId: number, conteudo: string) {
    return this.prisma.mensagem.create({
      data: { remetenteId, eventoId, conteudo },
    });
  }

  async verificarParticipacao(usuarioId: number, eventoId: number) {
    const ingresso = await this.prisma.ingresso.findFirst({
      where: {
        usuarioId,
        status: 'EMITIDO',
        reserva: {
          status: 'PAGO',
          sessao: { eventoId },
        },
      },
    });

    if (ingresso) return 'CLIENTE' as const;

    const evento = await this.prisma.evento.findFirst({
      where: { id: eventoId, organizadorId: usuarioId },
    });

    if (evento) return 'ORGANIZER' as const;

    return null;
  }

  async verificarEventoExiste(eventoId: number) {
    return this.prisma.evento.findFirst({
      where: { id: eventoId, status: 'PUBLICADO', excluidoEm: null },
      select: { id: true, titulo: true, organizadorId: true },
    });
  }

  listarPorEvento(eventoId: number) {
    return this.prisma.mensagem.findMany({
      where: { eventoId },
      orderBy: { criadoEm: 'asc' },
      include: {
        remetente: {
          select: { id: true, nome: true },
        },
      },
    });
  }

  async marcarLida(mensagemId: number) {
    return this.prisma.mensagem.update({
      where: { id: mensagemId },
      data: { lida: true },
    });
  }

  async contarNaoLidas(usuarioId: number) {
    const ingressos = await this.prisma.ingresso.findMany({
      where: {
        usuarioId,
        status: 'EMITIDO',
        reserva: { status: 'PAGO' },
      },
      select: {
        reserva: {
          select: { sessao: { select: { eventoId: true } } },
        },
      },
    });

    const eventosCliente = [
      ...new Set(ingressos.map((i) => i.reserva.sessao.eventoId)),
    ];

    const eventosOrganizador = await this.prisma.evento.findMany({
      where: { organizadorId: usuarioId },
      select: { id: true },
    });

    const todosEventosIds = [
      ...new Set([...eventosCliente, ...eventosOrganizador.map((e) => e.id)]),
    ];

    const contagem = await this.prisma.mensagem.groupBy({
      by: ['eventoId'],
      where: {
        eventoId: { in: todosEventosIds },
        lida: false,
        NOT: { remetenteId: usuarioId },
      },
      _count: true,
    });

    return contagem.map((c) => ({
      eventoId: c.eventoId,
      naoLidas: c._count,
    }));
  }
}
