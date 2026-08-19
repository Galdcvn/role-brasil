import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AtualizarSessaoDto } from './dto/atualizar-sessao.dto';
import { CriarSessaoDto } from './dto/criar-sessao.dto';
import { SessaoRepository } from './sessao.repository';

@Injectable()
export class SessaoService {
  constructor(private readonly sessaoRepository: SessaoRepository) {}

  async criar(organizadorId: number, eventoId: number, dto: CriarSessaoDto) {
    const evento = await this.sessaoRepository.verificarEvento(
      organizadorId,
      eventoId,
    );
    if (evento === null) {
      throw new NotFoundException('Evento não encontrado');
    }
    if (evento.status === 'CANCELADO') {
      throw new ConflictException(
        'Evento cancelado não pode receber novas sessões',
      );
    }
    return this.sessaoRepository.criar(
      eventoId,
      new Date(dto.dataHora),
      dto.fileiras,
      dto.assentosPorFileira,
    );
  }

  async listar(organizadorId: number, eventoId: number) {
    const evento = await this.sessaoRepository.verificarEvento(
      organizadorId,
      eventoId,
    );
    if (evento === null) {
      throw new NotFoundException('Evento não encontrado');
    }
    return this.sessaoRepository.buscar(eventoId);
  }

  async atualizar(organizadorId: number, id: number, dto: AtualizarSessaoDto) {
    await this.buscarSessaoDoOrganizador(organizadorId, id);
    const temReservas = (await this.sessaoRepository.contarReservas(id)) > 0;
    if (temReservas) {
      throw new ConflictException('Sessão com reservas não pode ser alterada');
    }
    return this.sessaoRepository.atualizarData(id, new Date(dto.dataHora));
  }

  async excluir(organizadorId: number, id: number) {
    await this.buscarSessaoDoOrganizador(organizadorId, id);
    const temReservas = (await this.sessaoRepository.contarReservas(id)) > 0;
    if (temReservas) {
      throw new ConflictException(
        'Sessão com reservas não pode ser excluída; cancele-a',
      );
    }
    return this.sessaoRepository.softDelete(id);
  }

  async cancelar(organizadorId: number, id: number) {
    await this.buscarSessaoDoOrganizador(organizadorId, id);
    return this.sessaoRepository.cancelar(id);
  }

  private async buscarSessaoDoOrganizador(organizadorId: number, id: number) {
    const sessao = await this.sessaoRepository.buscarPorId(id);
    if (sessao === null) {
      throw new NotFoundException('Sessão não encontrada');
    }
    const evento = await this.sessaoRepository.verificarEvento(
      organizadorId,
      sessao.eventoId,
    );
    if (evento === null) {
      throw new NotFoundException('Sessão não encontrada');
    }
    return sessao;
  }
}
