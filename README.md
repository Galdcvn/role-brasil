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
DATABASE_URL=postgresql://postgres.<ref>:<senha>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=20
```

> O `connect_timeout=20` é obrigatório na conexão com o pooler do Supabase nesta rede — sem ele o Prisma estoura o timeout no handshake TLS e falha com `P1001`.

Validação automática (husky, instalado pelo `npm install`):

- `pre-commit` → lint, typecheck e build dos dois pacotes.
- `pre-push` → testes com cobertura (thresholds configuráveis; meta 85%).

```bash
# Executar os mesmos checks manualmente
npm run lint:check && npm run typecheck && npm run build
npm run test:cov
```

---

## Linha do tempo das decisões

> Registro das decisões tomadas ao longo do desenvolvimento, com o contexto de cada uma. Inserida em ordem cronológica; decisões novas são adicionadas no topo.

### 15/08/2026 — Conexão com o Supabase (Postgres via pooler)

- **Supabase = Postgres apenas, sem RLS**: confirmada a decisão de manter **JWT próprio no NestJS** como camada de identidade; o RLS fica desligado (o cliente nunca acessa o Postgres direto e o papel `postgres` do Supabase burlaria as policies). A lib `@supabase/server` foi instalada em `server/` (movida da raiz), mas **fica sem uso** por enquanto.
- **Causa raiz do `P1001 Can't reach database server`**: o cert do pooler é emitido pela **CA privada do Supabase** (`Supabase Intermediate 2021 CA` — não confiada pelo store público, por isso Node/Prisma rejeitam em verificação estrita), mas a falha real era **timeout do engine**: o handshake TLS com o pooler na minha rede ultrapassa o timeout de conexão padrão do Prisma. Solução: **`&connect_timeout=20`** na `DATABASE_URL` (nenhum outro param foi necessário — `sslmode`/`sslaccept` não resolviam porque não era verificação).
- **Migration inicial reconciliada sem re-rodar SQL**: as 13 tabelas + enums + índices foram aplicadas **manualmente no dashboard** (SQL editor), mas sem a tabela `_prisma_migrations` — o Prisma via a migration como pendente. Como o SQL usa `CREATE TABLE` puro, re-aplicar falharia; usei **`prisma migrate resolve --applied 20260815000000_init`** para registrar a aplicação. `prisma migrate status` → "Database schema is up to date!".
- **Endpoints da conexão**: só o **transaction pooler** (`aws-0-sa-east-1.pooler.supabase.com:6543`) responde nesta rede — o session pooler (`:5432`) reseta/expira e o host direto `db.<ref>.supabase.co` não existe para o projeto (ENOTFOUND). Por isso `DIRECT_URL` fica documentada mas sem uso: o CLI (`prisma.config.ts`) usa a `DATABASE_URL` (pooler de transação) e o `migrate status` funciona, porém **lento (~5 min**, muitas queries de drift-check sobre handshakes TLS lentos).
- **Como a IA refinou**: o diagnóstico foi conduzido por sondagem sistemática — TCP, DNS (A/AAAA), handshake TLS com verificação estrita e com `rejectUnauthorized:false` (extraindo a cadeia de certs e o issuer), startup packet bruto no protocolo PG e varredura de params de URL via runtime client. Isso descartou senha (o `@` da senha parseia OK), IPv6, proxy e MITM antes de isolar o `connect_timeout`. Fica registrado o atalho mental errado que quase me levou a "trocar a senha": o sintoma de cert não confiado não era a causa.

### 15/08/2026 — Estrutura do backend (14 módulos + infra)

- **Estrutura de pastas/arquivos do backend (sem lógica)**: decisão de montar primeiro o esqueleto completo antes de qualquer funcionalidade — 12 módulos Nest gerados (`auth`, `usuario`, `catalog`, `evento`, `sessao`, `assento`, `reserva`, `pagamento`, `ingresso`, `validacao`, `favorito`, `stats`) + infra manual (`prisma/`, `common/`, `utils/`). Controllers/services são stubs compiláveis com specs de fumaça ("should be defined") — nenhuma regra de negócio implementada.
- **Repositories nos 8 módulos com tabela** (`usuario`, `evento`, `sessao`, `assento`, `reserva`, `pagamento`, `ingresso`, `favorito`): separar o acesso ao banco do service desde já (decisão minha); `validacao`/`stats` reutilizam repositórios alheios e `auth`/`catalog` não tocam tabelas.
- **`src/common/` para decorators e guards** (`@Roles`, `@Public`, `JwtAuthGuard`, `RolesGuard`) e **`src/utils/` para utilitários** (HMAC do QR, código curto, OTP, centavos — decisão minha, com avaliação da IA sobre não criar factory genérico, que seria sobre-engenharia).
- **Login com passport-local (autorizado)**: além do `passport-jwt` já planejado, entrou `passport-local` + `@types/passport-local` para autenticação por credenciais.
- **Cobertura do scaffold**: com specs em cada arquivo novo e exclusão padrão do wiring (`*.module.ts`, `main.ts`), o server mede **100% stmts / 75% branch / 100% funcs / 100% lines** — thresholds subidos no ramp-up para **85/70/85/85** (antes 45/45/70/40).
- **Como a IA refinou**: detectou e corrigiu o caminho relativo errado do `PrismaService` nos repositories (`../../` → `../`), o `require-await` de stubs async sem `await`, a falta de `getHandler`/`getClass` no mock do context (RolesGuard), o `switchToHttp().getRequest` sem tipo (`no-unsafe`) e o lançamento síncrono do TMDbAdapter (teste usa `toThrow`, não `rejects`).

### 15/08/2026 — Pipeline de validação local (Husky)

- **Decisão: hooks de git no repositório (sem CI externo)** — o `husky` foi instalado na raiz e os hooks rodam via `npm install` (script `prepare`). **`pre-commit`** executa lint (sem `--fix`), typecheck e build dos **dois** pacotes; **`pre-push`** executa os testes com cobertura e **bloqueia o push** se o threshold não for atingido. Nada de lint-staged: rodamos o projeto inteiro a cada hook (monorepo pequeno, builds rápidos — decisão minha, IA avaliou o trade-off).
- **Vitest no client (autorizado)**: o client não tinha framework de teste; entrou `vitest` + `@vitest/coverage-v8` + `jsdom` (DOM para componentes) com teste de fumaça do `App` usando `react-dom/client` + `act` — sem lib extra de testing (KISS). `AGENTS.md` atualizado: **Jest (server) + Vitest (client)**.
- **Cobertura com ramp-up (decisão: começar abaixo da meta)**: thresholds iniciais **abaixo do medido** — server ≈ 48% stmts / 43% lines / 75% funcs / 50% branch; client ≈ 75% — com **meta final de 85%** (regra do AGENTS.md). O plano é subir os thresholds por milestone até 85%. O pre-push já bloqueia abaixo do threshold atual.
- **Como a IA refinou**: na medição real, detectou que o relatório do Vitest v8 "escondia" arquivos 100% cobertos (agregado correto: 3/4 statements = App/Home/NotFound + main.tsx 0%); identificou que o **Vitest v4 não tem a opção `all`** (redundante, `include` já cobre arquivos não testados) — o que teria quebrado o typecheck; e **validou o enforcement com teste negativo** (threshold 90 → `exit 1` no Jest e no Vitest) antes de fixar os valores iniciais.

### 15/08/2026 — AGENTS.md: Princípios & Qualidade de Código

- **Atualização do `AGENTS.md` feita por mim**: nova seção **Princípios & Qualidade de Código** fixa a doutrina de código do projeto — **KISS** (simples e direto, sem sobre-engenharia), **DRY** (cada regra de negócio com representação única), **Clean Code** (nomes autoexplicativos, funções pequenas, sem comentários redundantes), **SOLID** (SRP, OCP, LSP, ISP, DIP) e **Design Patterns (GoF)** como vocabulário para problemas recorrentes.
- **Composição sobre herança**: nova regra negativa — **NÃO** usar herança de classes para reaproveitar código; preferir composição (props, render props, custom hooks no React; injeção de dependências/composição no Nest). Reforça a **Lei de Demeter** (sem encadeamentos profundos como `a.getB().doSomething()`).
- **Migrations**: nova regra — **NÃO rodar nenhuma migration sem autorização explícita** no chat (coerente com a migração inicial ainda não aplicada).
- **Como a IA refinou**: a atualização foi revisada com a IA, que apontou sobreposições (ex.: composição sobre herança já implicava o `I` e o `D` de SOLID) e sugeriu formatação que deixa cada princípio acionável e verificável — mas a decisão de adotá-los é minha. A partir daqui, todo código implementado segue esses princípios.

### 15/08/2026 — Node.js atualizado para 24.19.0 (LTS)

- **Execução da decisão anterior (Node >= 22.12)**: o Node 22.11.0 foi desinstalado (MSI) e o **Node.js 24.19.0 (LTS)** instalado via winget (`OpenJS.NodeJS.LTS`). Com o *engine check* satisfeito, o `npm install` voltou a instalar corretamente os bindings opcionais (`@oxlint/binding-win32-x64-msvc`, `@rolldown/binding-*`), eliminando a necessidade do workaround de pin por plataforma.
- **Checkpoint de validação pós-atualização (client + server)**: `lint`, `build` (typecheck + bundle) e testes passando nos dois lados — o client, que estava bloqueado, agora builda e lint limpo. Nenhum workaround manual de binding permanece no `package.json`.

### 15/08/2026 — Schema do banco (Prisma)

- **Modelo de dados consolidado no `schema.prisma`**: 13 modelos mapeados em snake_case (`Usuarios`, `Papeis`, `Papeis_Usuario`, `Eventos`, `Enderecos_Eventos`, `Categorias_Evento`, `Sessao_Eventos`, `Assentos_Sessao`, `Reservas`, `Reservas_Itens`, `Ingressos`, `Pagamentos`, `Favoritos`) + 8 enums (`EventoStatus`, `CategoriaIngresso`, `AssentoStatus`, `ReservaStatus`, `IngressoStatus`, `ComprovanteStatus`, `PagamentoTipo`, `PagamentoStatus`).
- **Integridade garantida no banco**: `UNIQUE(email)`, `UNIQUE(Papeis_Usuario.usuario_id + papel_id)`, `UNIQUE(Categorias_Evento.evento_id + nome)` (uma categoria por evento), `UNIQUE(Assentos_Sessao.sessao_id + fileira + numero)` (assento único por sessão — resolve o "mesmo lugar não pode ser vendido duas vezes" no nível de constraint, como planejado), `UNIQUE(Reservas_Itens.assento_sessao_id)` e `UNIQUE(Ingressos.assento_sessao_id)` (um item/ingresso por assento), `UNIQUE(Ingressos.codigo)` (código curto de digitação manual) e `UNIQUE(Favoritos.usuario_id + evento_id)`.
- **Preço e comprovante denormalizados nos itens/ingressos**: `Reservas_Itens` e `Ingressos` guardam cópia de `categoria` e `preco_centavos`. A tabela `Categorias_Evento` é o catálogo de preços vigente por evento; a cópia congela o valor na hora da compra (não muda se o organizador reajustar) e evita joins na validação da portaria.
- **Migração inicial versionada sem banco**: como a `DATABASE_URL` real (Supabase) ainda não foi configurada, o SQL foi gerado com `prisma migrate diff --from-empty --to-schema-datamodel --script` e salvo em `server/prisma/migrations/20260815000000_init/migration.sql` + `migration_lock.toml`. Quando a URL estiver disponível, basta `prisma migrate deploy` para aplicar.
- **`verificado`/`codigoVerificacao` na tabela `Usuarios`**: verificação de email e reset de senha por código OTP com fallback `000000` em dev (`ALLOW_OTP_FALLBACK`) — coerente com o que foi decidido no planejamento.
- **`pagamentos.status` sem estado de processamento pendente**: decisão do desenho — o pagamento é síncrono e determinístico no mock (cartão dígito par aprova, ímpar recusa; Pix sempre aprova), então só existem `APROVADO` e `RECUSADO`. A confirmação só ocorre após o gateway "aprovar".

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
