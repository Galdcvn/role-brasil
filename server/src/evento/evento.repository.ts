import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SELECT_EVENTO = {
  id: true,
  organizadorId: true,
  tmdbId: true,
  titulo: true,
  descricao: true,
  posterUrl: true,
  telefoneSuporte: true,
  emailSuporte: true,
  status: true,
  criadoEm: true,
  atualizadoEm: true,
  endereco: true,
  categorias: true,
} satisfies Prisma.EventoSelect;

export interface DadosCriarEvento {
  tmdbId?: number;
  titulo: string;
  descricao?: string;
  posterUrl?: string;
  telefoneSuporte?: string;
  emailSuporte?: string;
  endereco?: Prisma.EnderecosEventoCreateWithoutEventoInput;
  categorias: Prisma.CategoriasEventoCreateWithoutEventoInput[];
}

export interface DadosAtualizarEvento {
  titulo?: string;
  descricao?: string;
  posterUrl?: string;
  telefoneSuporte?: string;
  emailSuporte?: string;
  endereco?: Prisma.EnderecosEventoCreateWithoutEventoInput;
  categorias?: Prisma.CategoriasEventoCreateWithoutEventoInput[];
}

@Injectable()
export class EventoRepository {
  constructor(private readonly prisma: PrismaService) {}

  criar(organizadorId: number, dados: DadosCriarEvento) {
    return this.prisma.$transaction((tx) =>
      tx.evento.create({
        data: {
          organizadorId,
          tmdbId: dados.tmdbId,
          titulo: dados.titulo,
          descricao: dados.descricao,
          posterUrl: dados.posterUrl,
          telefoneSuporte: dados.telefoneSuporte,
          emailSuporte: dados.emailSuporte,
          ...(dados.endereco !== undefined && {
            endereco: { create: dados.endereco },
          }),
          categorias: { create: dados.categorias },
        },
        select: SELECT_EVENTO,
      }),
    );
  }

  buscarDoOrganizador(organizadorId: number, id: number) {
    return this.prisma.evento.findFirst({
      where: { id, organizadorId, excluidoEm: null },
      include: {
        endereco: true,
        categorias: { orderBy: { id: 'asc' } },
        sessoes: {
          where: { excluidoEm: null },
          orderBy: { dataHora: 'asc' },
          select: { id: true, dataHora: true, status: true },
        },
      },
    });
  }

  listarDoOrganizador(organizadorId: number) {
    return this.prisma.evento.findMany({
      where: { organizadorId, excluidoEm: null },
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        titulo: true,
        posterUrl: true,
        status: true,
        criadoEm: true,
        atualizadoEm: true,
        _count: {
          select: { sessoes: { where: { excluidoEm: null } } },
        },
      },
    });
  }

  atualizar(id: number, dados: DadosAtualizarEvento) {
    const data: Prisma.EventoUpdateInput = {
      ...(dados.titulo !== undefined && { titulo: dados.titulo }),
      ...(dados.descricao !== undefined && { descricao: dados.descricao }),
      ...(dados.posterUrl !== undefined && { posterUrl: dados.posterUrl }),
      ...(dados.telefoneSuporte !== undefined && {
        telefoneSuporte: dados.telefoneSuporte,
      }),
      ...(dados.emailSuporte !== undefined && {
        emailSuporte: dados.emailSuporte,
      }),
      ...(dados.endereco !== undefined && {
        endereco: {
          upsert: { create: dados.endereco, update: dados.endereco },
        },
      }),
    };

    return this.prisma.$transaction(async (tx) => {
      if (dados.categorias !== undefined) {
        await tx.categoriasEvento.deleteMany({ where: { eventoId: id } });
        data.categorias = { create: dados.categorias };
      }
      return tx.evento.update({
        where: { id },
        data,
        select: SELECT_EVENTO,
      });
    });
  }

  softDelete(id: number) {
    return this.prisma.evento.update({
      where: { id },
      data: { excluidoEm: new Date() },
      select: SELECT_EVENTO,
    });
  }

  cancelar(id: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.sessaoEvento.updateMany({
        where: { eventoId: id, status: 'ATIVA' },
        data: { status: 'CANCELADA' },
      });
      return tx.evento.update({
        where: { id },
        data: { status: 'CANCELADO' },
        select: SELECT_EVENTO,
      });
    });
  }

  publicar(id: number) {
    return this.prisma.evento.update({
      where: { id },
      data: { status: 'PUBLICADO' },
      select: SELECT_EVENTO,
    });
  }

  contarReservas(eventoId: number) {
    return this.prisma.reserva.count({
      where: { sessao: { eventoId } },
    });
  }

  buscarReservas(eventoId: number) {
    return this.prisma.reserva.findMany({
      where: { sessao: { eventoId } },
      select: {
        sessaoId: true,
        status: true,
        subtotalCentavos: true,
        ingressos: { select: { categoria: true } },
      },
    });
  }
}
