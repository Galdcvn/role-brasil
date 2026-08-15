# Seatly

Plataforma de eventos e ingressos (desafio Elite Dev). Um **organizador** monta um evento a partir de um catálogo de filmes do TMDb, define data, local, capacidade e preço, e publica. O **cliente** navega pelos eventos, escolhe o assento num mapa, paga de forma simulada e recebe um ingresso com QR assinado, que pode compartilhar por link. Na entrada, a **portaria** valida o ingresso lendo o QR pela câmera ou digitando o código.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite 8 |
| Estilos | Tailwind CSS 4 |
| Navegação | React Router 7 |
| Backend | NestJS |
| Banco de dados | Supabase (PostgreSQL) via Prisma |
| Autenticação | JWT próprio no NestJS (Passport) |

## Estrutura

```
Seatly/
├── README.md          # Resumo + linha do tempo de decisões
├── ARCHITECTURE.md    # Conceito da arquitetura (contexto do projeto para IA e revisores)
├── AGENTS.md          # Instruções de processo de execução para agentes de IA
├── package.json       # raiz: scripts dev/build/lint (client + server)
├── client/            # Front-end React + Vite
└── server/            # Back-end NestJS + Prisma
```

## Como rodar

> **Estado atual: configuração inicial.** O scaffold dos dois lados está pronto, mas nenhuma funcionalidade foi implementada ainda. Este README será atualizado conforme o projeto avança.

### Pré-requisitos

- **Node.js >= 22.12.0** (obrigatório — veja a linha do tempo sobre o Vite 8/rolldown)
- npm (ou yarn)

```bash
# Instalar dependências (raiz)
npm install

# Subir server e client juntos (server na :3000, client na :5173)
npm run dev
```

Variáveis de ambiente (`server/.env`):

```env
DATABASE_URL=postgresql://...
```

---

## Linha do tempo das decisões

> Registro das decisões tomadas ao longo do desenvolvimento, com o contexto de cada uma. Inserida em ordem cronológica; decisões novas são adicionadas no topo.

### 15/08/2026 — Boas práticas de uso de IA

- **Arquivos de contexto para IA (`AGENTS.md` e `ARCHITECTURE.md`)**: decisão de fixar no repositório dois arquivos que documentam como a IA deve trabalhar no projeto — `ARCHITECTURE.md` entrega o contexto/conceito da arquitetura, e `AGENTS.md` entrega o processo de execução (stack, regras negativas, desenvolvimento modular, TDD com cobertura mínima de 85% e checkpoints de typecheck/lint/build/testes entre módulos). A intenção é que a IA opere dentro das mesmas regras e do mesmo entendimento que qualquer desenvolvedor do time, sem "adivinhar" convenções — e que isso seja versionado junto com o código.

### 15/08/2026 — Configuração inicial (scaffold)

- **Gerador Prisma `prisma-client-js` (clássico) em vez do `prisma-client` (novo)**: o `prisma init` 6.19 gera por padrão o gerador novo, que escreve o client em TS dentro do repo (`server/generated/`). Como o tsconfig do Nest compila tudo que está fora de `node_modules`, esse código gerado entrava no build e deslocava a raiz de compilação — resultado: `dist/src/main.js` em vez do `dist/main.js` esperado pelo NestJS (e o `start:prod` quebrava). Trocar para `prisma-client-js` mantém o client em `node_modules`, fora do build, e o layout `dist/main.js` padrão. Custo aceito: ao migrar para Prisma 7 no futuro, o gerador novo será o caminho.
- **Node.js >= 22.12.0 exigido pelo Vite 8 (rolldown) e pelo oxlint**: na primeira instalação, o build e o lint do client quebraram com "Cannot find native binding". A causa não é um bug do npm nesta máquina, e sim o *engine check*: os bindings nativos (`@rolldown/binding-*`, `@oxlint/binding-*`) declaram `node: ^20.19.0 || >=22.12.0`, e o Node instalado (22.11.0) não atendia — npm pula dependência opcional que falha no engine de forma silenciosa, sem erro. **Decisão: atualizar o Node para a versão LTS mais recente** em vez de fazer workaround no package.json (pin de binding por plataforma), que exigiria manter versão sincronizada manualmente a cada update. Fica registrado aqui porque um erro enigmático de "binding" costuma ser mal diagnosticado.
- **Stack obrigatória + monorepo `client`/`server`**: React com TypeScript no front, NestJS no back, Supabase (Postgres) como banco. Escolha direta do enunciado.
- **Nome do projeto — Seatly**: remete ao "assento garantido" — a garantia de que o lugar escolhido é seu é o coração do produto. Nome curto, fácil de lembrar e que marca o domínio sem soar genérico.
- **Vite em vez de Next.js**: o projeto não precisa de SSR; Vite entrega um dev loop mais simples e rápido, e o link compartilhado de ingresso pode ser uma rota comum do SPA. Consistente com o Route_Manager_RJ (stack que já usei e validei).
- **Monorepo sem npm workspaces**: `client` e `server` são pacotes independentes com lockfiles próprios. O root só orquestra com `concurrently`. Evita o hoisting de dependências (que costuma gerar surpresas com NestJS/Vite) e mantém cada lado versionável de forma isolada.
- **Supabase apenas como PostgreSQL via Prisma**: o Supabase entra como banco gerenciado; toda a lógica de negócio, autenticação e regras de integridade ficam no NestJS. A escolha da ferramenta não engessa o projeto — trocar de banco é trocar a `DATABASE_URL`.
- **Schema de domínio postergado**: nesta etapa não foi criado nenhum modelo Prisma nem tabelas. O desenho do schema é a decisão mais estrutural do projeto e será feito junto com a implementação, quando as regras (reserva, ingresso, validação) estiverem claras.
- **Autenticação: JWT próprio no NestJS** (decisão antecipada no planejamento): três papéis (Organizador, Cliente, Portaria) como `role` dentro do token. Mantém o Supabase como provedor de Postgres apenas, sem acoplar a camada de identidade a ele.
- **Catálogo: TMDb** (decisão antecipada): filmes, chave gratuita e REST simples. Será modelado como adapter (`CatalogProvider`) para permitir plugar Ticketmaster no futuro.
- **Reserva: mapa de assentos** (decisão antecipada): exercita diretamente o requisito de "mesmo lugar não ser vendido duas vezes", resolvido com unique constraint no banco.
- **Ingresso com QR assinado por HMAC** (decisão antecipada): o QR carrega um token assinado com segredo do servidor — impossível de forjar sem o segredo. Validação na portaria será atômica para impedir uso duplo.
- **Pagamento simulado determinístico** (decisão antecipada): regra documentada (ex.: último dígito do cartão ímpar recusa) para permitir testar os dois caminhos (confirmação e recusa) de forma previsível, sem provedor real.

---

## Uso de IA

Todas as decisões de arquitetura e escopo deste projeto foram tomadas por mim (humano) e registradas acima. A IA foi usada como parada técnica: scaffoldeou a estrutura de acordo com o plano aprovado e não implementou nenhuma funcionalidade. O detalhamento de cada parte é descrito nesta linha do tempo.

Para garantir que a IA trabalhe dentro das regras e do contexto do projeto, o repositório inclui dois arquivos: **`AGENTS.md`** (processo de execução — stack, regras negativas, desenvolvimento modular, TDD com cobertura ≥ 85% e checkpoints de validação entre módulos) e **`ARCHITECTURE.md`** (conceito da arquitetura). Ambos são lidos e seguidos pelos agentes de IA durante o desenvolvimento.
