import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { FavoritoRepository } from './favorito.repository';

describe('FavoritoRepository', () => {
  let repository: FavoritoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FavoritoRepository, { provide: PrismaService, useValue: {} }],
    }).compile();

    repository = module.get<FavoritoRepository>(FavoritoRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
