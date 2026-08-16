import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { UsuarioRepository } from './usuario.repository';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let repositoryMock: {
    findById: jest.Mock;
    update: jest.Mock;
    desativar: jest.Mock;
  };

  beforeEach(() => {
    repositoryMock = {
      findById: jest.fn(),
      update: jest.fn(),
      desativar: jest.fn(),
    };
    service = new UsuarioService(
      repositoryMock as unknown as UsuarioRepository,
    );
  });

  it('me retorna o usuário pelo id', async () => {
    repositoryMock.findById.mockResolvedValue({ id: 7 });

    const resultado = await service.me(7);

    expect(repositoryMock.findById).toHaveBeenCalledWith(7);
    expect(resultado).toEqual({ id: 7 });
  });

  it('atualizarPerfil repassa id e dto ao repository', async () => {
    const dto: AtualizarUsuarioDto = { nome: 'Novo Nome' };
    repositoryMock.update.mockResolvedValue({ id: 7, nome: 'Novo Nome' });

    const resultado = await service.atualizarPerfil(7, dto);

    expect(repositoryMock.update).toHaveBeenCalledWith(7, dto);
    expect(resultado).toEqual({ id: 7, nome: 'Novo Nome' });
  });

  it('desativar chama o repository com o id', async () => {
    repositoryMock.desativar.mockResolvedValue({ id: 7, ativo: false });

    const resultado = await service.desativar(7);

    expect(repositoryMock.desativar).toHaveBeenCalledWith(7);
    expect(resultado).toEqual({ id: 7, ativo: false });
  });
});
