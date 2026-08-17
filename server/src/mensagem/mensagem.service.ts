import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MensagemRepository } from './mensagem.repository';

@Injectable()
export class MensagemService {
  constructor(private readonly mensagemRepository: MensagemRepository) {}

  async enviar(usuarioId: number, eventoId: number, conteudo: string) {
    if (!conteudo || conteudo.trim().length === 0) {
      throw new BadRequestException('Mensagem não pode ser vazia');
    }

    const evento =
      await this.mensagemRepository.verificarEventoExiste(eventoId);
    if (evento === null) {
      throw new NotFoundException('Evento não encontrado');
    }

    const papel = await this.mensagemRepository.verificarParticipacao(
      usuarioId,
      eventoId,
    );
    if (papel === null) {
      throw new ForbiddenException(
        'Você não tem permissão para enviar mensagens neste evento',
      );
    }

    return this.mensagemRepository.criar(usuarioId, eventoId, conteudo.trim());
  }

  async listarPorEvento(usuarioId: number, eventoId: number) {
    const evento =
      await this.mensagemRepository.verificarEventoExiste(eventoId);
    if (evento === null) {
      throw new NotFoundException('Evento não encontrado');
    }

    const papel = await this.mensagemRepository.verificarParticipacao(
      usuarioId,
      eventoId,
    );
    if (papel === null) {
      throw new ForbiddenException(
        'Você não tem permissão para ver mensagens deste evento',
      );
    }

    return this.mensagemRepository.listarPorEvento(eventoId);
  }

  async marcarLida(usuarioId: number, mensagemId: number) {
    return this.mensagemRepository.marcarLida(mensagemId);
  }

  async contarNaoLidas(usuarioId: number) {
    return this.mensagemRepository.contarNaoLidas(usuarioId);
  }
}
