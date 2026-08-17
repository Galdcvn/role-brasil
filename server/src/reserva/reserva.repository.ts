import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ItemCriar {
  assentoSessaoId: number;
  categoria: string;
  precoCentavos: number;
}

@Injectable()
export class ReservaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(usuarioId: number, sessaoId: number, itens: ItemCriar[]) {
    const subtotal = itens.reduce((acc, item) => acc + item.precoCentavos, 0);
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      for (const item of itens) {
        await tx.assentosSessao.update({
          where: { id: item.assentoSessaoId },
          data: { status: 'RESERVADO' },
        });
      }

      return tx.reserva.create({
        data: {
          usuarioId,
          sessaoId,
          subtotalCentavos: subtotal,
          expiraEm,
          itens: {
            create: itens.map((item) => ({
              assentoSessaoId: item.assentoSessaoId,
              categoria: item.categoria as never,
              precoCentavos: item.precoCentavos,
            })),
          },
        },
        include: {
          itens: true,
          sessao: {
            select: {
              id: true,
              dataHora: true,
              evento: { select: { id: true, titulo: true } },
            },
          },
        },
      });
    });
  }

  async buscarPrecosCategoria(sessaoId: number) {
    const categorias = await this.prisma.categoriasEvento.findMany({
      where: {
        evento: {
          sessoes: { some: { id: sessaoId } },
        },
      },
    });

    const precos = new Map<string, number>();
    for (const cat of categorias) {
      precos.set(cat.nome, cat.precoCentavos);
    }
    return precos;
  }

  async buscarSessaoAtiva(sessaoId: number) {
    const sessao = await this.prisma.sessaoEvento.findFirst({
      where: {
        id: sessaoId,
        status: 'ATIVA',
        excluidoEm: null,
        evento: { status: 'PUBLICADO', excluidoEm: null },
      },
      select: { id: true, eventoId: true },
    });
    return sessao;
  }

  listarPorUsuario(usuarioId: number) {
    return this.prisma.reserva.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
      include: {
        itens: true,
        sessao: {
          select: {
            id: true,
            dataHora: true,
            evento: {
              select: { id: true, titulo: true, posterUrl: true },
            },
          },
        },
      },
    });
  }

  buscarPorId(id: number) {
    return this.prisma.reserva.findUnique({
      where: { id },
      include: {
        itens: true,
        sessao: {
          select: {
            id: true,
            dataHora: true,
            evento: {
              select: { id: true, titulo: true, posterUrl: true },
            },
          },
        },
      },
    });
  }

  async expirarReservas() {
    const agora = new Date();

    const pendentes = await this.prisma.reserva.findMany({
      where: { status: 'PENDENTE', expiraEm: { lte: agora } },
      select: {
        id: true,
        itens: { select: { assentoSessaoId: true } },
      },
    });

    for (const reserva of pendentes) {
      await this.prisma.$transaction(async (tx) => {
        for (const item of reserva.itens) {
          await tx.assentosSessao.update({
            where: { id: item.assentoSessaoId },
            data: { status: 'DISPONIVEL' },
          });
        }

        await tx.reserva.update({
          where: { id: reserva.id },
          data: { status: 'EXPIRADO' },
        });
      });
    }

    return pendentes.length;
  }
}
