import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const EMAIL_ORGANIZADOR = 'organizador@rolebrasil.com';
const SENHA_ORGANIZADOR = 'Organizador@123';
const NOME_ORGANIZADOR = 'João Organizador';

async function main() {
  const papel = await prisma.papel.findFirst({ where: { nome: 'ORGANIZER' } });
  const papelCriado = papel ?? (await prisma.papel.create({ data: { nome: 'ORGANIZER' } }));

  const usuario = await prisma.usuario.findUnique({
    where: { email: EMAIL_ORGANIZADOR },
  });

  if (usuario) {
    console.log(`Organizador já existe (id ${usuario.id}). Pulando.`);
    return;
  }

  const senha = await bcrypt.hash(SENHA_ORGANIZADOR, 10);

  const novo = await prisma.usuario.create({
    data: {
      nome: NOME_ORGANIZADOR,
      email: EMAIL_ORGANIZADOR,
      senha,
      verificado: true,
      papeis: { create: { papelId: papelCriado.id } },
    },
  });

  console.log(`Organizador criado: id=${novo.id} email=${EMAIL_ORGANIZADOR}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
