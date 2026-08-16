-- CreateEnum
CREATE TYPE "SessaoStatus" AS ENUM ('ATIVA', 'CANCELADA');

-- AlterTable
ALTER TABLE "Sessao_Eventos" ADD COLUMN "status" "SessaoStatus" NOT NULL DEFAULT 'ATIVA',
ADD COLUMN "excluido_em" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Eventos" ADD COLUMN "excluido_em" TIMESTAMP(3);
