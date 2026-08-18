import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface StatsOrganizador {
  totalEventos: number;
  eventosPorStatus: Record<string, number>;
  totalReservas: number;
  totalReceitaCentavos: number;
  totalIngressos: number;
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async buscarStats(organizadorId: number): Promise<StatsOrganizador> {
    const eventos = await this.prisma.evento.findMany({
      where: { organizadorId, excluidoEm: null },
      select: { id: true, status: true },
    });

    const eventosPorStatus: Record<string, number> = {};
    for (const ev of eventos) {
      eventosPorStatus[ev.status] = (eventosPorStatus[ev.status] ?? 0) + 1;
    }

    const eventoIds = eventos.map((e) => e.id);

    if (eventoIds.length === 0) {
      return {
        totalEventos: 0,
        eventosPorStatus: {},
        totalReservas: 0,
        totalReceitaCentavos: 0,
        totalIngressos: 0,
      };
    }

    const [reservasAggregate, ingressosCount] = await Promise.all([
      this.prisma.reserva.aggregate({
        where: {
          sessao: { eventoId: { in: eventoIds } },
          status: 'PAGO',
        },
        _sum: { subtotalCentavos: true },
        _count: true,
      }),
      this.prisma.ingresso.count({
        where: {
          reserva: {
            sessao: { eventoId: { in: eventoIds } },
          },
          status: 'EMITIDO',
        },
      }),
    ]);

    return {
      totalEventos: eventos.length,
      eventosPorStatus,
      totalReservas: reservasAggregate._count,
      totalReceitaCentavos: reservasAggregate._sum.subtotalCentavos ?? 0,
      totalIngressos: ingressosCount,
    };
  }
}
