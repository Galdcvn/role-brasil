import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PagamentoRepository } from './pagamento.repository';

describe('PagamentoRepository', () => {
  let repository: PagamentoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagamentoRepository,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    repository = module.get<PagamentoRepository>(PagamentoRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
