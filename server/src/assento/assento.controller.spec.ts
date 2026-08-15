import { Test, TestingModule } from '@nestjs/testing';
import { AssentoController } from './assento.controller';

describe('AssentoController', () => {
  let controller: AssentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssentoController],
    }).compile();

    controller = module.get<AssentoController>(AssentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
