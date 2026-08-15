import { Test, TestingModule } from '@nestjs/testing';
import { FavoritoController } from './favorito.controller';

describe('FavoritoController', () => {
  let controller: FavoritoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritoController],
    }).compile();

    controller = module.get<FavoritoController>(FavoritoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
