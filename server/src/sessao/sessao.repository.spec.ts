import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SessaoRepository } from './sessao.repository';

describe('SessaoRepository', () => {
  let repository: SessaoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessaoRepository, { provide: PrismaService, useValue: {} }],
    }).compile();

    repository = module.get<SessaoRepository>(SessaoRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
