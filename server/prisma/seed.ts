import { PrismaClient, CategoriaIngresso, AssentoStatus, SessaoStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SENHA = 'Senha@123';

const USUARIOS = [
  {
    nome: 'João Organizador',
    email: 'organizador@rolebrasil.com',
    papel: 'ORGANIZER',
  },
  {
    nome: 'Maria Cliente',
    email: 'maria@rolebrasil.com',
    papel: 'CLIENT',
  },
  {
    nome: 'Pedro Cliente',
    email: 'pedro@rolebrasil.com',
    papel: 'CLIENT',
  },
  {
    nome: 'Ana Portaria',
    email: 'ana@rolebrasil.com',
    papel: 'PORTARIA',
  },
];

async function main() {
  const senhaHash = await bcrypt.hash(SENHA, 10);

  for (const u of USUARIOS) {
    const existente = await prisma.usuario.findUnique({
      where: { email: u.email },
    });
    if (existente) {
      console.log(`${u.papel} já existe (${u.email}). Pulando.`);
      continue;
    }

    const papel =
      (await prisma.papel.findFirst({ where: { nome: u.papel } })) ??
      (await prisma.papel.create({ data: { nome: u.papel } }));

    const usuario = await prisma.usuario.create({
      data: {
        nome: u.nome,
        email: u.email,
        senha: senhaHash,
        verificado: true,
        papeis: { create: { papelId: papel.id } },
      },
    });

    console.log(`${u.papel} criado: ${u.email} (id=${usuario.id})`);
  }

  const organizador = await prisma.usuario.findUnique({
    where: { email: 'organizador@rolebrasil.com' },
  });

  if (!organizador) {
    console.error('Organizador não encontrado. Abortando seed de evento.');
    return;
  }

  const eventoExistente = await prisma.evento.findFirst({
    where: { titulo: 'Rock in Rio 2026', organizadorId: organizador.id },
  });

  if (eventoExistente) {
    console.log(`Evento já existe (id=${eventoExistente.id}). Pulando.`);
    return;
  }

  const evento = await prisma.evento.create({
    data: {
      titulo: 'Rock in Rio 2026',
      descricao:
        'O maior festival de música do mundo retorna ao Rio de Janeiro com atrações nacionais e internacionais.',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/qhfXrYccD6VqogxUVJfvfKLE0dR.jpg',
      status: 'PUBLICADO',
      organizadorId: organizador.id,
      telefoneSuporte: '(21) 99999-0000',
      emailSuporte: 'suporte@rolebrasil.com',
      endereco: {
        create: {
          rua: 'Rua Jardim Oceânico',
          numero: null,
          bairro: 'Jardim Oceânico',
          cidade: 'Rio de Janeiro',
          estado: 'RJ',
          cep: '22010-020',
        },
      },
      categorias: {
        create: [
          { nome: CategoriaIngresso.INTEIRA, precoCentavos: 35000 },
          { nome: CategoriaIngresso.MEIA, precoCentavos: 80000 },
          { nome: CategoriaIngresso.GRATUIDADE, precoCentavos: 120000 },
        ],
      },
    },
  });

  console.log(`Evento criado: ${evento.titulo} (id=${evento.id})`);

  const sessao = await prisma.sessaoEvento.create({
    data: {
      eventoId: evento.id,
      dataHora: new Date('2026-09-15T20:00:00-03:00'),
      status: SessaoStatus.ATIVA,
    },
  });

  console.log(`Sessão criada: id=${sessao.id}`);

  const fileiras = ['A', 'B', 'C', 'D', 'E'];
  const assentosPorFileira = 12;

  const assentosData: {
    sessaoId: number;
    fileira: string;
    numero: number;
    status: AssentoStatus;
  }[] = [];

  for (const f of fileiras) {
    for (let n = 1; n <= assentosPorFileira; n++) {
      assentosData.push({
        sessaoId: sessao.id,
        fileira: f,
        numero: n,
        status: AssentoStatus.DISPONIVEL,
      });
    }
  }

  await prisma.assentosSessao.createMany({ data: assentosData });
  console.log(
    `${assentosData.length} assentos criados para a sessão ${sessao.id}`,
  );

  const sessao2 = await prisma.sessaoEvento.create({
    data: {
      eventoId: evento.id,
      dataHora: new Date('2026-09-16T20:00:00-03:00'),
      status: SessaoStatus.ATIVA,
    },
  });

  const assentosData2: typeof assentosData = [];
  for (const f of fileiras) {
    for (let n = 1; n <= assentosPorFileira; n++) {
      assentosData2.push({
        sessaoId: sessao2.id,
        fileira: f,
        numero: n,
        status: AssentoStatus.DISPONIVEL,
      });
    }
  }

  await prisma.assentosSessao.createMany({ data: assentosData2 });
  console.log(`Sessão 2 criada: id=${sessao2.id} (${assentosData2.length} assentos)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
