import { Test, TestingModule } from '@nestjs/testing';
import { ValidacaoService } from './validacao.service';

describe('ValidacaoService', () => {
  let service: ValidacaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidacaoService],
    }).compile();

    service = module.get<ValidacaoService>(ValidacaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
