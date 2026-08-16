import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const NOME_PAPEL_CLIENT = 'CLIENT';

const SELECT_PAPEIS = {
  id: true,
  nome: true,
  email: true,
  verificado: true,
  ativo: true,
  codigoVerificacao: true,
  codigoVerificacaoExpiraEm: true,
  criadoEm: true,
  papeis: {
    select: { papel: { select: { nome: true } } },
  },
} satisfies Prisma.UsuarioSelect;

const SELECT_BASICO = {
  id: true,
  nome: true,
  email: true,
  verificado: true,
  ativo: true,
  codigoVerificacao: true,
  codigoVerificacaoExpiraEm: true,
  criadoEm: true,
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dados: { nome: string; email: string; senha: string }) {
    return this.prisma.$transaction(async (tx) => {
      const papel = await tx.papel.findFirst({
        where: { nome: NOME_PAPEL_CLIENT },
      });
      const papelId =
        papel?.id ??
        (await tx.papel.create({ data: { nome: NOME_PAPEL_CLIENT } })).id;

      return tx.usuario.create({
        data: {
          nome: dados.nome,
          email: dados.email,
          senha: dados.senha,
          papeis: { create: { papelId } },
        },
        select: SELECT_PAPEIS,
      });
    });
  }

  findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      select: SELECT_PAPEIS,
    });
  }

  findByEmailComSenha(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      include: { papeis: { include: { papel: true } } },
    });
  }

  findById(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: SELECT_PAPEIS,
    });
  }

  update(id: number, dados: { nome?: string; email?: string }) {
    return this.prisma.usuario.update({
      where: { id },
      data: dados,
      select: SELECT_PAPEIS,
    });
  }

  setCodigoVerificacao(id: number, codigo: number, expiraEm: Date) {
    return this.prisma.usuario.update({
      where: { id },
      data: { codigoVerificacao: codigo, codigoVerificacaoExpiraEm: expiraEm },
      select: SELECT_BASICO,
    });
  }

  updateVerificado(id: number) {
    return this.prisma.usuario.update({
      where: { id },
      data: {
        verificado: true,
        codigoVerificacao: null,
        codigoVerificacaoExpiraEm: null,
      },
      select: SELECT_BASICO,
    });
  }

  desativar(id: number) {
    return this.prisma.usuario.update({
      where: { id },
      data: { ativo: false },
      select: SELECT_BASICO,
    });
  }
}
