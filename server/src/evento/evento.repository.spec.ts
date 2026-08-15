import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EventoRepository } from './evento.repository';

describe('EventoRepository', () => {
  let repository: EventoRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventoRepository, { provide: PrismaService, useValue: {} }],
    }).compile();

    repository = module.get<EventoRepository>(EventoRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
