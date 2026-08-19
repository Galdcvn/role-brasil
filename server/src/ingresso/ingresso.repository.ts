import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IngressoRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarPorUsuario(usuarioId: number) {
    return this.prisma.ingresso.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
      include: {
        reserva: {
          select: {
            id: true,
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
        },
        assento: { select: { fileira: true, numero: true } },
      },
    });
  }

  buscarPorId(id: number) {
    return this.prisma.ingresso.findUnique({
      where: { id },
      include: {
        reserva: {
          select: {
            id: true,
            sessao: {
              select: {
                id: true,
                dataHora: true,
                evento: {
                  select: {
                    id: true,
                    titulo: true,
                    posterUrl: true,
                    endereco: true,
                  },
                },
              },
            },
            itens: {
              select: {
                categoria: true,
                precoCentavos: true,
              },
            },
          },
        },
        assento: { select: { fileira: true, numero: true } },
      },
    });
  }

  async cancelar(ingressoId: number) {
    return this.prisma.$transaction(async (tx) => {
      const ingresso = await tx.ingresso.findUniqueOrThrow({
        where: { id: ingressoId },
      });

      const pagamento = await tx.pagamento.findFirst({
        where: { reservaId: ingresso.reservaId, status: 'APROVADO' },
      });

      await tx.ingresso.update({
        where: { id: ingressoId },
        data: { status: 'CANCELADO' },
      });

      await tx.assentosSessao.update({
        where: { id: ingresso.assentoSessaoId },
        data: { status: 'DISPONIVEL' },
      });

      if (pagamento) {
        await tx.pagamento.update({
          where: { id: pagamento.id },
          data: { status: 'ESTORNADO' },
        });
      }

      await tx.reserva.update({
        where: { id: ingresso.reservaId },
        data: { status: 'CANCELADO' },
      });

      return ingresso;
    });
  }
}
