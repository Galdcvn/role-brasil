import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagamentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarReservaPendente(reservaId: number) {
    return this.prisma.reserva.findFirst({
      where: { id: reservaId, status: 'PENDENTE' },
      include: {
        itens: { select: { assentoSessaoId: true, categoria: true } },
        sessao: { select: { eventoId: true } },
      },
    });
  }

  async processarAprovado(
    reservaId: number,
    valorCentavos: number,
    tipo: string,
    dadosCartao?: { finalCartao: string },
    codigoPix?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUniqueOrThrow({
        where: { id: reservaId },
        include: { itens: true },
      });

      await tx.pagamento.create({
        data: {
          reservaId,
          valorCentavos,
          tipo: tipo as 'PIX' | 'CARTAO',
          status: 'APROVADO',
          finalCartao: dadosCartao?.finalCartao,
          codigoPix,
          processadoEm: new Date(),
        },
      });

      await tx.reserva.update({
        where: { id: reservaId },
        data: { status: 'PAGO', pagoEm: new Date() },
      });

      for (const item of reserva.itens) {
        await tx.assentosSessao.update({
          where: { id: item.assentoSessaoId },
          data: { status: 'VENDIDO' },
        });
      }

      const ingressos: { id: number; codigo: string }[] = [];
      for (const item of reserva.itens) {
        const codigo = randomBytes(8)
          .toString('base64url')
          .toUpperCase()
          .slice(0, 16);
        const qrToken = randomBytes(16).toString('hex');

        const ingresso = await tx.ingresso.create({
          data: {
            reservaId,
            assentoSessaoId: item.assentoSessaoId,
            usuarioId: reserva.usuarioId,
            categoria: item.categoria,
            codigo,
            qrToken,
          },
        });
        ingressos.push(ingresso);
      }

      return { reserva, ingressos };
    });
  }

  async processarRecusado(reservaId: number) {
    return this.prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUniqueOrThrow({
        where: { id: reservaId },
        include: { itens: true },
      });

      await tx.reserva.update({
        where: { id: reservaId },
        data: { status: 'CANCELADO' },
      });

      for (const item of reserva.itens) {
        await tx.assentosSessao.update({
          where: { id: item.assentoSessaoId },
          data: { status: 'DISPONIVEL' },
        });
      }

      return reserva;
    });
  }
}
