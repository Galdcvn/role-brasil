import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ReservaRepository } from './reserva.repository';

describe('ReservaRepository', () => {
  let repository: ReservaRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReservaRepository, { provide: PrismaService, useValue: {} }],
    }).compile();

    repository = module.get<ReservaRepository>(ReservaRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
