import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ResultadoScan } from '@prisma/client';
import { PortariaRepository } from './portaria.repository';

@Injectable()
export class PortariaService {
  constructor(private readonly portariaRepository: PortariaRepository) {}

  async validar(usuarioId: number, dto: { codigo: string; eventoId?: number }) {
    const ingresso = await this.portariaRepository.buscarPorCodigo(dto.codigo);

    if (ingresso === null) {
      await this.registrarScan(
        usuarioId,
        0,
        'REJEITADO',
        'Ingresso não encontrado',
      );
      throw new NotFoundException('Ingresso não encontrado');
    }

    if (dto.eventoId) {
      const eventoIdIngresso = ingresso.reserva.sessao.evento.id;
      if (eventoIdIngresso !== dto.eventoId) {
        await this.registrarScan(
          usuarioId,
          ingresso.id,
          'REJEITADO',
          'Ingresso pertence a outro evento',
        );
        throw new ConflictException('Ingresso pertence a outro evento');
      }
    }

    if (ingresso.status === 'USADO') {
      await this.registrarScan(
        usuarioId,
        ingresso.id,
        'REJEITADO',
        'Ingresso já utilizado',
      );
      throw new ConflictException('Ingresso já utilizado');
    }

    if (ingresso.status === 'CANCELADO') {
      await this.registrarScan(
        usuarioId,
        ingresso.id,
        'REJEITADO',
        'Ingresso cancelado',
      );
      throw new ConflictException('Ingresso cancelado');
    }

    if (ingresso.categoria === 'MEIA' || ingresso.categoria === 'GRATUIDADE') {
      await this.registrarScan(
        usuarioId,
        ingresso.id,
        'PENDENTE_DOCUMENTACAO',
        `Categoria ${ingresso.categoria} — necessária verificação de documentação`,
      );
      return {
        status: 'PENDENTE_DOCUMENTACAO' as const,
        ingresso: {
          id: ingresso.id,
          codigo: ingresso.codigo,
          categoria: ingresso.categoria,
          evento: ingresso.reserva.sessao.evento.titulo,
          assento: `${ingresso.assento.fileira}${ingresso.assento.numero}`,
          usuario: ingresso.usuario.nome,
        },
      };
    }

    await this.portariaRepository.validarIngresso(ingresso.id);
    await this.registrarScan(
      usuarioId,
      ingresso.id,
      'APROVADO',
      'Acesso liberado',
    );

    return {
      status: 'APROVADO' as const,
      ingresso: {
        id: ingresso.id,
        codigo: ingresso.codigo,
        categoria: ingresso.categoria,
        evento: ingresso.reserva.sessao.evento.titulo,
        assento: `${ingresso.assento.fileira}${ingresso.assento.numero}`,
        usuario: ingresso.usuario.nome,
      },
    };
  }

  async confirmarComprovante(usuarioId: number, ingressoId: number) {
    const ingresso = await this.buscarIngressoOuFalhar(ingressoId);

    if (ingresso.comprovanteStatus !== 'PENDENTE') {
      throw new ConflictException(
        'Comprovante não está pendente de verificação',
      );
    }

    await this.portariaRepository.confirmarComprovante(ingressoId);
    await this.registrarScan(
      usuarioId,
      ingressoId,
      'DOCUMENTACAO_CONFIRMADA',
      'Documentação confirmada — acesso liberado',
    );

    return { status: 'APROVADO' as const };
  }

  async rejeitarComprovante(usuarioId: number, ingressoId: number) {
    const ingresso = await this.buscarIngressoOuFalhar(ingressoId);

    if (ingresso.comprovanteStatus !== 'PENDENTE') {
      throw new ConflictException(
        'Comprovante não está pendente de verificação',
      );
    }

    await this.portariaRepository.rejeitarComprovante(ingressoId);
    await this.registrarScan(
      usuarioId,
      ingressoId,
      'DOCUMENTACAO_RECUSADA',
      'Documentação rejeitada',
    );

    return { status: 'REJEITADO' as const };
  }

  async listarHistorico(usuarioId: number) {
    return this.portariaRepository.listarHistorico(usuarioId);
  }

  async listarHistoricoPorEvento(usuarioId: number, eventoId: number) {
    return this.portariaRepository.listarHistoricoPorEvento(
      usuarioId,
      eventoId,
    );
  }

  private async buscarIngressoOuFalhar(ingressoId: number) {
    const ingresso = await this.portariaRepository.buscarPorId(ingressoId);
    if (ingresso === null) {
      throw new NotFoundException('Ingresso não encontrado');
    }
    return ingresso;
  }

  private async registrarScan(
    portariaId: number,
    ingressoId: number,
    resultado: ResultadoScan,
    observacao?: string,
  ) {
    return this.portariaRepository.registrarScan({
      portariaId,
      ingressoId,
      resultado,
      observacao,
    });
  }
}
