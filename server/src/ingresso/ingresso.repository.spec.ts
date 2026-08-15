import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { IngressoRepository } from './ingresso.repository';

describe('IngressoRepository', () => {
  let repository: IngressoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IngressoRepository, { provide: PrismaService, useValue: {} }],
    }).compile();

    repository = module.get<IngressoRepository>(IngressoRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
