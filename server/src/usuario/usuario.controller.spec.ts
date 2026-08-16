import { Request } from 'express';
import { UsuarioAutenticado } from '../auth/types/autenticado';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';

describe('UsuarioController', () => {
  let controller: UsuarioController;
  let serviceMock: {
    me: jest.Mock;
    atualizarPerfil: jest.Mock;
    desativar: jest.Mock;
  };

  beforeEach(() => {
    serviceMock = {
      me: jest.fn(),
      atualizarPerfil: jest.fn(),
      desativar: jest.fn(),
    };
    controller = new UsuarioController(
      serviceMock as unknown as UsuarioService,
    );
  });

  const req = (usuarioId: number) =>
    ({
      user: { sub: usuarioId, email: 'a@b.c', roles: ['CLIENT'] },
    }) as unknown as Request & { user: UsuarioAutenticado };

  it('me retorna os dados do usuário autenticado', async () => {
    serviceMock.me.mockResolvedValue({ id: 7 });

    const resultado = await controller.me(req(7));

    expect(serviceMock.me).toHaveBeenCalledWith(7);
    expect(resultado).toEqual({ id: 7 });
  });

  it('atualizarPerfil repassa o usuário autenticado e o dto', async () => {
    const dto: AtualizarUsuarioDto = { nome: 'Novo' };
    serviceMock.atualizarPerfil.mockResolvedValue({ id: 7, nome: 'Novo' });

    const resultado = await controller.atualizarPerfil(req(7), dto);

    expect(serviceMock.atualizarPerfil).toHaveBeenCalledWith(7, dto);
    expect(resultado).toEqual({ id: 7, nome: 'Novo' });
  });

  it('desativar desativa o usuário autenticado', async () => {
    serviceMock.desativar.mockResolvedValue({ id: 7, ativo: false });

    const resultado = await controller.desativar(req(7));

    expect(serviceMock.desativar).toHaveBeenCalledWith(7);
    expect(resultado).toEqual({ id: 7, ativo: false });
  });
});
