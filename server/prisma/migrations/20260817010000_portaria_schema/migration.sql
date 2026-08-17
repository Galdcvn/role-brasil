-- CreateEnum
CREATE TYPE "ResultadoScan" AS ENUM ('APROVADO', 'REJEITADO', 'PENDENTE_DOCUMENTACAO', 'DOCUMENTACAO_CONFIRMADA', 'DOCUMENTACAO_RECUSADA');

-- CreateTable
CREATE TABLE "Portaria_Scans" (
    "id" SERIAL NOT NULL,
    "portaria_id" INTEGER NOT NULL,
    "ingresso_id" INTEGER NOT NULL,
    "resultado" "ResultadoScan" NOT NULL,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Portaria_Scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Portaria_Scans_portaria_id_idx" ON "Portaria_Scans"("portaria_id");

-- CreateIndex
CREATE INDEX "Portaria_Scans_ingresso_id_idx" ON "Portaria_Scans"("ingresso_id");

-- AddForeignKey
ALTER TABLE "Portaria_Scans" ADD CONSTRAINT "Portaria_Scans_portaria_id_fkey" FOREIGN KEY ("portaria_id") REFERENCES "Usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portaria_Scans" ADD CONSTRAINT "Portaria_Scans_ingresso_id_fkey" FOREIGN KEY ("ingresso_id") REFERENCES "Ingressos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
