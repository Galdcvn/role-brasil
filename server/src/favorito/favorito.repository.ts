import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritoRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscar(usuarioId: number, eventoId: number) {
    return this.prisma.favorito.findUnique({
      where: { usuarioId_eventoId: { usuarioId, eventoId } },
    });
  }

  adicionar(usuarioId: number, eventoId: number) {
    return this.prisma.favorito.create({
      data: { usuarioId, eventoId },
    });
  }

  remover(usuarioId: number, eventoId: number) {
    return this.prisma.favorito.delete({
      where: { usuarioId_eventoId: { usuarioId, eventoId } },
    });
  }

  listarEventosIds(usuarioId: number) {
    return this.prisma.favorito.findMany({
      where: { usuarioId },
      select: { eventoId: true },
    });
  }
}
