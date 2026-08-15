import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AssentoRepository } from './assento.repository';

describe('AssentoRepository', () => {
  let repository: AssentoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssentoRepository, { provide: PrismaService, useValue: {} }],
    }).compile();

    repository = module.get<AssentoRepository>(AssentoRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
