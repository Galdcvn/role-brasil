import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SELECT_SESSAO = {
  id: true,
  eventoId: true,
  dataHora: true,
  status: true,
  criadoEm: true,
} satisfies Prisma.SessaoEventoSelect;

@Injectable()
export class SessaoRepository {
  constructor(private readonly prisma: PrismaService) {}

  verificarEvento(organizadorId: number, eventoId: number) {
    return this.prisma.evento.findFirst({
      where: { id: eventoId, organizadorId, excluidoEm: null },
      select: { id: true, status: true },
    });
  }

  criar(
    eventoId: number,
    dataHora: Date,
    fileiras: number,
    assentosPorFileira: number,
  ) {
    const FILEIRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    return this.prisma.$transaction(async (tx) => {
      const sessao = await tx.sessaoEvento.create({
        data: { eventoId, dataHora },
        select: SELECT_SESSAO,
      });

      const assentosData: {
        sessaoId: number;
        fileira: string;
        numero: number;
      }[] = [];
      for (let f = 0; f < fileiras; f++) {
        const letra = FILEIRAS[f];
        for (let a = 1; a <= assentosPorFileira; a++) {
          assentosData.push({ sessaoId: sessao.id, fileira: letra, numero: a });
        }
      }

      await tx.assentosSessao.createMany({ data: assentosData });

      return sessao;
    });
  }

  buscar(eventoId: number) {
    return this.prisma.sessaoEvento.findMany({
      where: { eventoId, excluidoEm: null },
      orderBy: { dataHora: 'asc' },
      select: {
        id: true,
        dataHora: true,
        status: true,
        criadoEm: true,
        _count: { select: { reservas: true } },
      },
    });
  }

  buscarPorId(id: number) {
    return this.prisma.sessaoEvento.findFirst({
      where: { id, excluidoEm: null },
      select: { id: true, eventoId: true },
    });
  }

  atualizarData(id: number, dataHora: Date) {
    return this.prisma.sessaoEvento.update({
      where: { id },
      data: { dataHora },
      select: SELECT_SESSAO,
    });
  }

  softDelete(id: number) {
    return this.prisma.sessaoEvento.update({
      where: { id },
      data: { excluidoEm: new Date() },
      select: SELECT_SESSAO,
    });
  }

  cancelar(id: number) {
    return this.prisma.sessaoEvento.update({
      where: { id },
      data: { status: 'CANCELADA' },
      select: SELECT_SESSAO,
    });
  }

  contarReservas(id: number) {
    return this.prisma.reserva.count({
      where: { sessaoId: id },
    });
  }
}
