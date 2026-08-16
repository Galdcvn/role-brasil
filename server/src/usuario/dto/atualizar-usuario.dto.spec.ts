import { AtualizarUsuarioDto } from './atualizar-usuario.dto';

describe('AtualizarUsuarioDto', () => {
  it('cria uma instância com todos os campos preenchidos', () => {
    const dto = new AtualizarUsuarioDto();
    dto.nome = 'Ana';
    dto.email = 'ana@example.com';

    expect(dto).toBeInstanceOf(AtualizarUsuarioDto);
    expect(dto.nome).toBe('Ana');
    expect(dto.email).toBe('ana@example.com');
  });

  it('aceita um dto vazio (campos opcionais)', () => {
    const dto = new AtualizarUsuarioDto();
    expect(dto).toBeInstanceOf(AtualizarUsuarioDto);
    expect(dto.nome).toBeUndefined();
    expect(dto.email).toBeUndefined();
  });
});
