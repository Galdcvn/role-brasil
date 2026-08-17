import { Injectable } from '@nestjs/common';
import { ResultadoScan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortariaRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarPorCodigo(codigo: string) {
    return this.prisma.ingresso.findUnique({
      where: { codigo },
      include: this.includeCompleto,
    });
  }

  buscarPorQrToken(qrToken: string) {
    return this.prisma.ingresso.findFirst({
      where: { qrToken },
      include: this.includeCompleto,
    });
  }

  buscarPorId(ingressoId: number) {
    return this.prisma.ingresso.findUnique({
      where: { id: ingressoId },
      include: this.includeCompleto,
    });
  }

  async validarIngresso(ingressoId: number) {
    return this.prisma.ingresso.update({
      where: { id: ingressoId },
      data: { status: 'USADO', usadoEm: new Date() },
    });
  }

  async confirmarComprovante(ingressoId: number) {
    return this.prisma.ingresso.update({
      where: { id: ingressoId },
      data: {
        comprovanteStatus: 'CONFIRMADO',
        status: 'USADO',
        usadoEm: new Date(),
      },
    });
  }

  async rejeitarComprovante(ingressoId: number) {
    return this.prisma.ingresso.update({
      where: { id: ingressoId },
      data: { comprovanteStatus: 'RECUSADO' },
    });
  }

  registrarScan(dados: {
    portariaId: number;
    ingressoId: number;
    resultado: ResultadoScan;
    observacao?: string;
  }) {
    return this.prisma.portariaScan.create({ data: dados });
  }

  listarHistorico(portariaId: number) {
    return this.prisma.portariaScan.findMany({
      where: { portariaId },
      orderBy: { criadoEm: 'desc' },
      include: { ingresso: this.selectIngressoHistorico },
    });
  }

  listarHistoricoPorEvento(portariaId: number, eventoId: number) {
    return this.prisma.portariaScan.findMany({
      where: {
        portariaId,
        ingresso: { reserva: { sessao: { eventoId } } },
      },
      orderBy: { criadoEm: 'desc' },
      include: { ingresso: this.selectIngressoHistorico },
    });
  }

  private readonly includeCompleto = {
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
                status: true,
              },
            },
          },
        },
      },
    },
    assento: { select: { fileira: true, numero: true } },
    usuario: { select: { id: true, nome: true, email: true } },
  } as const;

  private readonly selectIngressoHistorico = {
    select: {
      id: true,
      codigo: true,
      categoria: true,
      status: true,
      comprovanteStatus: true,
      reserva: {
        select: {
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
    },
  } as const;
}
