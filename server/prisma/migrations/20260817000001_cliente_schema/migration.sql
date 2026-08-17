-- AlterEnum: Adiciona valores aos enums existentes
ALTER TYPE "IngressoStatus" ADD VALUE 'CANCELADO';
ALTER TYPE "PagamentoStatus" ADD VALUE 'ESTORNADO';

-- CreateTable: Mensagens
CREATE TABLE "Mensagens" (
    "id" SERIAL NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "remetente_id" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mensagens_evento_id_idx" ON "Mensagens"("evento_id");
CREATE INDEX "Mensagens_remetente_id_idx" ON "Mensagens"("remetente_id");

-- AddForeignKey
ALTER TABLE "Mensagens" ADD CONSTRAINT "Mensagens_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "Eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensagens" ADD CONSTRAINT "Mensagens_remetente_id_fkey" FOREIGN KEY ("remetente_id") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
