import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarPorSessao(sessaoId: number) {
    return this.prisma.assentosSessao.findMany({
      where: { sessaoId },
      orderBy: [{ fileira: 'asc' }, { numero: 'asc' }],
      select: { id: true, fileira: true, numero: true, status: true },
    });
  }

  buscarPorIds(ids: number[]) {
    return this.prisma.assentosSessao.findMany({
      where: { id: { in: ids } },
    });
  }
}
