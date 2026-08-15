import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IngressoRepository {
  constructor(private readonly prisma: PrismaService) {}
}
