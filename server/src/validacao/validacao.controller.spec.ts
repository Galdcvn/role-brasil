import { Test, TestingModule } from '@nestjs/testing';
import { ValidacaoController } from './validacao.controller';

describe('ValidacaoController', () => {
  let controller: ValidacaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValidacaoController],
    }).compile();

    controller = module.get<ValidacaoController>(ValidacaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
