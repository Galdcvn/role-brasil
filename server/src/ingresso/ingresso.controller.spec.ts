import { Test, TestingModule } from '@nestjs/testing';
import { IngressoController } from './ingresso.controller';

describe('IngressoController', () => {
  let controller: IngressoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngressoController],
    }).compile();

    controller = module.get<IngressoController>(IngressoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
