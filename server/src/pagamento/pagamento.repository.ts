import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PagamentoRepository {
  constructor(private readonly prisma: PrismaService) {}
}
