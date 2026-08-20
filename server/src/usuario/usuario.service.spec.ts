import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { UsuarioRepository } from './usuario.repository';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let repositoryMock: {
    findById: jest.Mock;
    update: jest.Mock;
    desativar: jest.Mock;
    findByIdComSenha: jest.Mock;
    updateSenha: jest.Mock;
  };

  beforeEach(() => {
    repositoryMock = {
      findById: jest.fn(),
      update: jest.fn(),
      desativar: jest.fn(),
      findByIdComSenha: jest.fn(),
      updateSenha: jest.fn(),
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

  describe('alterarSenha', () => {
    it('lança NotFoundException quando usuário não existe', async () => {
      repositoryMock.findByIdComSenha.mockResolvedValue(null);
      const dto: AlterarSenhaDto = {
        senhaAtual: 'atual',
        novaSenha: 'nova123',
      };
      await expect(service.alterarSenha(7, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lança BadRequestException quando senha atual está incorreta', async () => {
      const hash = await bcrypt.hash('senha-correta', 10);
      repositoryMock.findByIdComSenha.mockResolvedValue({ id: 7, senha: hash });
      const dto: AlterarSenhaDto = {
        senhaAtual: 'errada',
        novaSenha: 'nova123',
      };
      await expect(service.alterarSenha(7, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('atualiza a senha quando credenciais são válidas', async () => {
      const hash = await bcrypt.hash('senha-atual', 10);
      repositoryMock.findByIdComSenha.mockResolvedValue({ id: 7, senha: hash });
      repositoryMock.updateSenha.mockResolvedValue(undefined);
      const dto: AlterarSenhaDto = {
        senhaAtual: 'senha-atual',
        novaSenha: 'nova-senha',
      };
      const resultado = await service.alterarSenha(7, dto);
      expect(repositoryMock.updateSenha).toHaveBeenCalledWith(
        7,
        expect.any(String) as string,
      );
      const args = repositoryMock.updateSenha.mock.calls[0] as unknown as [
        number,
        string,
      ];
      const hashedSenha = args[1];
      expect(await bcrypt.compare('nova-senha', hashedSenha)).toBe(true);
      expect(resultado).toEqual({ mensagem: 'Senha alterada com sucesso' });
    });
  });
});
