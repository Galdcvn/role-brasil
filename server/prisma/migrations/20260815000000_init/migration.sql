-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EventoStatus" AS ENUM ('RASCUNHO', 'PUBLICADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CategoriaIngresso" AS ENUM ('INTEIRA', 'MEIA', 'GRATUIDADE');

-- CreateEnum
CREATE TYPE "AssentoStatus" AS ENUM ('DISPONIVEL', 'RESERVADO', 'VENDIDO');

-- CreateEnum
CREATE TYPE "ReservaStatus" AS ENUM ('PENDENTE', 'PAGO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "IngressoStatus" AS ENUM ('EMITIDO', 'USADO');

-- CreateEnum
CREATE TYPE "ComprovanteStatus" AS ENUM ('NAO_NECESSARIO', 'PENDENTE', 'CONFIRMADO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "PagamentoTipo" AS ENUM ('PIX', 'CARTAO');

-- CreateEnum
CREATE TYPE "PagamentoStatus" AS ENUM ('APROVADO', 'RECUSADO');

-- CreateTable
CREATE TABLE "Usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "codigoVerificacao" INTEGER,
    "codigoVerificacaoExpiraEm" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Papeis" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,

    CONSTRAINT "Papeis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Papeis_Usuario" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "papel_id" INTEGER NOT NULL,

    CONSTRAINT "Papeis_Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Eventos" (
    "id" SERIAL NOT NULL,
    "organizador_id" INTEGER NOT NULL,
    "tmdb_id" INTEGER,
    "titulo" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "poster_url" VARCHAR(500),
    "telefone_suporte" VARCHAR(20),
    "email_suporte" VARCHAR(255),
    "status" "EventoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3),

    CONSTRAINT "Eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enderecos_Eventos" (
    "id" SERIAL NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "cep" VARCHAR(9) NOT NULL,
    "rua" VARCHAR(255) NOT NULL,
    "numero" INTEGER,
    "bairro" VARCHAR(255) NOT NULL,
    "cidade" VARCHAR(255) NOT NULL,
    "estado" VARCHAR(2) NOT NULL,

    CONSTRAINT "Enderecos_Eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categorias_Evento" (
    "id" SERIAL NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "nome" "CategoriaIngresso" NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "requer_comprovante" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Categorias_Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao_Eventos" (
    "id" SERIAL NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sessao_Eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assentos_Sessao" (
    "id" SERIAL NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "fileira" VARCHAR(10) NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" "AssentoStatus" NOT NULL DEFAULT 'DISPONIVEL',

    CONSTRAINT "Assentos_Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservas" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "sessao_id" INTEGER NOT NULL,
    "status" "ReservaStatus" NOT NULL DEFAULT 'PENDENTE',
    "subtotal_centavos" INTEGER NOT NULL DEFAULT 0,
    "expira_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pago_em" TIMESTAMP(3),

    CONSTRAINT "Reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservas_Itens" (
    "id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "assento_sessao_id" INTEGER NOT NULL,
    "categoria" "CategoriaIngresso" NOT NULL,
    "preco_centavos" INTEGER NOT NULL,

    CONSTRAINT "Reservas_Itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingressos" (
    "id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "assento_sessao_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "categoria" "CategoriaIngresso" NOT NULL,
    "codigo" VARCHAR(16) NOT NULL,
    "qr_token" VARCHAR(255) NOT NULL,
    "status" "IngressoStatus" NOT NULL DEFAULT 'EMITIDO',
    "usado_em" TIMESTAMP(3),
    "comprovante_status" "ComprovanteStatus" NOT NULL DEFAULT 'NAO_NECESSARIO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ingressos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamentos" (
    "id" SERIAL NOT NULL,
    "reserva_id" INTEGER NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "tipo" "PagamentoTipo" NOT NULL,
    "status" "PagamentoStatus" NOT NULL,
    "final_cartao" VARCHAR(4),
    "codigo_pix" VARCHAR(255),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processado_em" TIMESTAMP(3),

    CONSTRAINT "Pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favoritos" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuarios_email_key" ON "Usuarios"("email");

-- CreateIndex
CREATE INDEX "Papeis_Usuario_papel_id_idx" ON "Papeis_Usuario"("papel_id");

-- CreateIndex
CREATE UNIQUE INDEX "Papeis_Usuario_usuario_id_papel_id_key" ON "Papeis_Usuario"("usuario_id", "papel_id");

-- CreateIndex
CREATE INDEX "Eventos_organizador_id_idx" ON "Eventos"("organizador_id");

-- CreateIndex
CREATE INDEX "Eventos_status_idx" ON "Eventos"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Enderecos_Eventos_evento_id_key" ON "Enderecos_Eventos"("evento_id");

-- CreateIndex
CREATE UNIQUE INDEX "Categorias_Evento_evento_id_nome_key" ON "Categorias_Evento"("evento_id", "nome");

-- CreateIndex
CREATE INDEX "Sessao_Eventos_evento_id_idx" ON "Sessao_Eventos"("evento_id");

-- CreateIndex
CREATE INDEX "Assentos_Sessao_sessao_id_idx" ON "Assentos_Sessao"("sessao_id");

-- CreateIndex
CREATE UNIQUE INDEX "Assentos_Sessao_sessao_id_fileira_numero_key" ON "Assentos_Sessao"("sessao_id", "fileira", "numero");

-- CreateIndex
CREATE INDEX "Reservas_usuario_id_idx" ON "Reservas"("usuario_id");

-- CreateIndex
CREATE INDEX "Reservas_sessao_id_idx" ON "Reservas"("sessao_id");

-- CreateIndex
CREATE UNIQUE INDEX "Reservas_Itens_assento_sessao_id_key" ON "Reservas_Itens"("assento_sessao_id");

-- CreateIndex
CREATE INDEX "Reservas_Itens_reserva_id_idx" ON "Reservas_Itens"("reserva_id");

-- CreateIndex
CREATE UNIQUE INDEX "Ingressos_assento_sessao_id_key" ON "Ingressos"("assento_sessao_id");

-- CreateIndex
CREATE UNIQUE INDEX "Ingressos_codigo_key" ON "Ingressos"("codigo");

-- CreateIndex
CREATE INDEX "Ingressos_reserva_id_idx" ON "Ingressos"("reserva_id");

-- CreateIndex
CREATE INDEX "Ingressos_usuario_id_idx" ON "Ingressos"("usuario_id");

-- CreateIndex
CREATE INDEX "Pagamentos_reserva_id_idx" ON "Pagamentos"("reserva_id");

-- CreateIndex
CREATE INDEX "Favoritos_evento_id_idx" ON "Favoritos"("evento_id");

-- CreateIndex
CREATE UNIQUE INDEX "Favoritos_usuario_id_evento_id_key" ON "Favoritos"("usuario_id", "evento_id");

-- AddForeignKey
ALTER TABLE "Papeis_Usuario" ADD CONSTRAINT "Papeis_Usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Papeis_Usuario" ADD CONSTRAINT "Papeis_Usuario_papel_id_fkey" FOREIGN KEY ("papel_id") REFERENCES "Papeis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Eventos" ADD CONSTRAINT "Eventos_organizador_id_fkey" FOREIGN KEY ("organizador_id") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enderecos_Eventos" ADD CONSTRAINT "Enderecos_Eventos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "Eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categorias_Evento" ADD CONSTRAINT "Categorias_Evento_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "Eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao_Eventos" ADD CONSTRAINT "Sessao_Eventos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "Eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assentos_Sessao" ADD CONSTRAINT "Assentos_Sessao_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "Sessao_Eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservas" ADD CONSTRAINT "Reservas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservas" ADD CONSTRAINT "Reservas_sessao_id_fkey" FOREIGN KEY ("sessao_id") REFERENCES "Sessao_Eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservas_Itens" ADD CONSTRAINT "Reservas_Itens_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "Reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservas_Itens" ADD CONSTRAINT "Reservas_Itens_assento_sessao_id_fkey" FOREIGN KEY ("assento_sessao_id") REFERENCES "Assentos_Sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingressos" ADD CONSTRAINT "Ingressos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "Reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingressos" ADD CONSTRAINT "Ingressos_assento_sessao_id_fkey" FOREIGN KEY ("assento_sessao_id") REFERENCES "Assentos_Sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingressos" ADD CONSTRAINT "Ingressos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamentos" ADD CONSTRAINT "Pagamentos_reserva_id_fkey" FOREIGN KEY ("reserva_id") REFERENCES "Reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favoritos" ADD CONSTRAINT "Favoritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favoritos" ADD CONSTRAINT "Favoritos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "Eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
