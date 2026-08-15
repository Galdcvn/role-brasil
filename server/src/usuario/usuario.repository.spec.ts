import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioRepository } from './usuario.repository';

describe('UsuarioRepository', () => {
  let repository: UsuarioRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsuarioRepository, { provide: PrismaService, useValue: {} }],
    }).compile();

    repository = module.get<UsuarioRepository>(UsuarioRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
