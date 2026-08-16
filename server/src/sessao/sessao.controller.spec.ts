import { AtualizarSessaoDto } from './dto/atualizar-sessao.dto';
import { CriarSessaoDto } from './dto/criar-sessao.dto';
import { SessaoController } from './sessao.controller';
import { SessaoService } from './sessao.service';

describe('SessaoController', () => {
  let controller: SessaoController;
  let serviceMock: {
    criar: jest.Mock;
    listar: jest.Mock;
    atualizar: jest.Mock;
    excluir: jest.Mock;
    cancelar: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      criar: jest.fn(),
      listar: jest.fn(),
      atualizar: jest.fn(),
      excluir: jest.fn(),
      cancelar: jest.fn(),
    };
    controller = new SessaoController(serviceMock as unknown as SessaoService);
  });

  const requisicao = { user: { sub: 7 } };

  it('criar delega com id do organizador e do evento', () => {
    const dto = new CriarSessaoDto();
    serviceMock.criar.mockReturnValue({ id: 1 });
    const resultado = controller.criar(requisicao, 3, dto);
    expect(serviceMock.criar).toHaveBeenCalledWith(7, 3, dto);
    expect(resultado).toEqual({ id: 1 });
  });

  it('listar delega com id do organizador e do evento', () => {
    serviceMock.listar.mockReturnValue([{ id: 1 }]);
    const resultado = controller.listar(requisicao, 3);
    expect(serviceMock.listar).toHaveBeenCalledWith(7, 3);
    expect(resultado).toEqual([{ id: 1 }]);
  });

  it('atualizar delega com id do organizador e da sessão', () => {
    const dto = new AtualizarSessaoDto();
    serviceMock.atualizar.mockReturnValue({ id: 1 });
    const resultado = controller.atualizar(requisicao, 9, dto);
    expect(serviceMock.atualizar).toHaveBeenCalledWith(7, 9, dto);
    expect(resultado).toEqual({ id: 1 });
  });

  it('excluir delega com id do organizador e da sessão', () => {
    serviceMock.excluir.mockReturnValue({ id: 1 });
    const resultado = controller.excluir(requisicao, 9);
    expect(serviceMock.excluir).toHaveBeenCalledWith(7, 9);
    expect(resultado).toEqual({ id: 1 });
  });

  it('cancelar delega com id do organizador e da sessão', () => {
    serviceMock.cancelar.mockReturnValue({ id: 1 });
    const resultado = controller.cancelar(requisicao, 9);
    expect(serviceMock.cancelar).toHaveBeenCalledWith(7, 9);
    expect(resultado).toEqual({ id: 1 });
  });

  it('CriarSessaoDto e AtualizarSessaoDto são instanciáveis', () => {
    expect(new CriarSessaoDto()).toBeInstanceOf(CriarSessaoDto);
    expect(new AtualizarSessaoDto()).toBeInstanceOf(AtualizarSessaoDto);
  });
});
