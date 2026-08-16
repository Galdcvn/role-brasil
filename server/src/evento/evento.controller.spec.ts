import { AtualizarEventoDto } from './dto/atualizar-evento.dto';
import { CategoriaDto } from './dto/categoria.dto';
import { CriarEventoDto } from './dto/criar-evento.dto';
import { EnderecoDto } from './dto/endereco.dto';
import { EventoController } from './evento.controller';
import { EventoService } from './evento.service';

describe('EventoController', () => {
  let controller: EventoController;
  let serviceMock: {
    criar: jest.Mock;
    listar: jest.Mock;
    detalhe: jest.Mock;
    atualizar: jest.Mock;
    excluir: jest.Mock;
    cancelar: jest.Mock;
    publicar: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      criar: jest.fn(),
      listar: jest.fn(),
      detalhe: jest.fn(),
      atualizar: jest.fn(),
      excluir: jest.fn(),
      cancelar: jest.fn(),
      publicar: jest.fn(),
    };
    controller = new EventoController(serviceMock as unknown as EventoService);
  });

  const requisicao = { user: { sub: 7 } };

  it('criar delega com o id do organizador', () => {
    const dto = new CriarEventoDto();
    serviceMock.criar.mockReturnValue({ id: 1 });
    const resultado = controller.criar(requisicao, dto);
    expect(serviceMock.criar).toHaveBeenCalledWith(7, dto);
    expect(resultado).toEqual({ id: 1 });
  });

  it('listar delega com o id do organizador', () => {
    serviceMock.listar.mockReturnValue([{ id: 1 }]);
    const resultado = controller.listar(requisicao);
    expect(serviceMock.listar).toHaveBeenCalledWith(7);
    expect(resultado).toEqual([{ id: 1 }]);
  });

  it('detalhe delega com id do organizador e do evento', () => {
    serviceMock.detalhe.mockReturnValue({ id: 1 });
    const resultado = controller.detalhe(requisicao, 9);
    expect(serviceMock.detalhe).toHaveBeenCalledWith(7, 9);
    expect(resultado).toEqual({ id: 1 });
  });

  it('atualizar delega com id do organizador e do evento', () => {
    const dto = new AtualizarEventoDto();
    serviceMock.atualizar.mockReturnValue({ id: 1 });
    const resultado = controller.atualizar(requisicao, 9, dto);
    expect(serviceMock.atualizar).toHaveBeenCalledWith(7, 9, dto);
    expect(resultado).toEqual({ id: 1 });
  });

  it('excluir delega com id do organizador e do evento', () => {
    serviceMock.excluir.mockReturnValue({ id: 1 });
    const resultado = controller.excluir(requisicao, 9);
    expect(serviceMock.excluir).toHaveBeenCalledWith(7, 9);
    expect(resultado).toEqual({ id: 1 });
  });

  it('cancelar delega com id do organizador e do evento', () => {
    serviceMock.cancelar.mockReturnValue({ id: 1 });
    const resultado = controller.cancelar(requisicao, 9);
    expect(serviceMock.cancelar).toHaveBeenCalledWith(7, 9);
    expect(resultado).toEqual({ id: 1 });
  });

  it('publicar delega com id do organizador e do evento', () => {
    serviceMock.publicar.mockReturnValue({ id: 1 });
    const resultado = controller.publicar(requisicao, 9);
    expect(serviceMock.publicar).toHaveBeenCalledWith(7, 9);
    expect(resultado).toEqual({ id: 1 });
  });

  it('EnderecoDto, CategoriaDto e AtualizarEventoDto são instanciáveis', () => {
    expect(new EnderecoDto()).toBeInstanceOf(EnderecoDto);
    expect(new CategoriaDto()).toBeInstanceOf(CategoriaDto);
    expect(new AtualizarEventoDto()).toBeInstanceOf(AtualizarEventoDto);
  });
});
