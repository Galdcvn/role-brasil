import { Test, TestingModule } from '@nestjs/testing';
import { FavoritoService } from './favorito.service';

describe('FavoritoService', () => {
  let service: FavoritoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FavoritoService],
    }).compile();

    service = module.get<FavoritoService>(FavoritoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
