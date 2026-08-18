# Rolê Brasil

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
role-brasil/
├── README.md          # Resumo + linha do tempo de decisões
├── ARCHITECTURE.md    # Conceito da arquitetura (contexto do projeto para IA e revisores)
├── AGENTS.md          # Instruções de processo de execução para agentes de IA
├── package.json       # raiz: scripts dev/build/lint (client + server)
├── client/            # Front-end React + Vite
└── server/            # Back-end NestJS + Prisma
```

## Deploy

| Serviço | O que roda | URL | Config |
|---------|-----------|-----|--------|
| **Vercel** | Client (React SPA) | — | `vercel.json` — builda client com deps, SPA routing |
| **Railway** | Server (NestJS + Prisma) | `https://role-brasil-production.up.railway.app` | `Dockerfile` + `railway.json` (Node 22, prisma generate, nest build) |
| **Supabase** | PostgreSQL (banco de dados) | — | — |

### Variáveis de ambiente

**Server (Railway):**

```env
DATABASE_URL=postgresql://postgres.<ref>:<senha>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=20
TMDB_API_KEY=<chave da API do TMDb>
JWT_SECRET=<segredo para assinar tokens>
ALLOW_OTP_FALLBACK=true
PORT=3000
```

**Client (Vercel):**

```env
VITE_API_URL=https://role-brasil-production.up.railway.app/api
```

> O client lê `VITE_API_URL` para saber onde buscar a API. Em dev, o fallback é `/api` (proxy do Vite → `localhost:3000`).

> **Railway:** `DATABASE_URL` precisa estar disponível tanto em runtime quanto em build (marcar "Available during build" no dashboard). O `prisma.config.ts` carrega a env var durante `npx prisma generate`.

### Migrations

As migrations são escritas manualmente no SQL Editor do Supabase — **não** rodar `prisma migrate deploy` antes de aplicar no dashboard.

| Migration | Status |
|-----------|--------|
| `20260815000000_init` | Aplicada |
| `20260815000001_usuario_ativo` | Aplicada |
| `20260815000002_organizador_fluxo` | Aplicada |
| `20260817000001_cliente_schema` | Pendente |
| `20260817010000_portaria_schema` | Pendente |

---

## Como rodar

> **Estado atual: backend completo** — autenticação, módulo organizador (catálogo TMDb, eventos, sessões), módulo cliente (rotas públicas, favoritos, assentos, reservas, pagamentos, ingressos, mensagens) e módulo portaria (validação de ingressos, comprovantes, histórico) implementados no server, com **254 testes** passando. O client tem Portal unificado (sidebar, bottom nav, tema escuro), páginas de Login/Registro conectadas à API, e **42 testes** passando com coverage ≥ 90%.

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
TMDB_API_KEY=<chave da API do TMDb — catálogo de filmes>
JWT_SECRET=<segredo aleatório para assinar os tokens>
ALLOW_OTP_FALLBACK=true
```

> O `connect_timeout=20` é obrigatório na conexão com o pooler do Supabase nesta rede — sem ele o Prisma estoura o timeout no handshake TLS e falha com `P1001`. O `JWT_SECRET` assina os tokens de acesso (gere um valor aleatório e não o compartilhe). Com `ALLOW_OTP_FALLBACK=true`, o código OTP de verificação "enviado por email" é devolvido na resposta de registro e o código `000000` sempre funciona — simula o email sem infraestrutura real (desligue em produção).

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

### 18/08/2026 — Fix fluxo auth completo (validação OTP + dead-lock + reenvio)

- **Bug raiz — DTO `verificar-email`**: `@IsInt()` rejeitava strings mesmo com `transform: true`. Fix: `@Transform(({ value }) => Number(value))` antes de `@IsInt()`.
- **Dead-lock removido**: `registrar()` agora reenvia OTP quando email+papel já existem mas não verificados (antes dava 409 e travava o usuário). Só dá 409 se o email já estiver verificado.
- **Novo endpoint `POST /auth/reenviar-codigo`**: aceita `{ email }`, gera novo OTP para usuários não verificados. Rate limit não implementado (futuro).
- **`comFallbackDev` removido**: o código OTP nunca mais é retornado na resposta — nem em dev. O fallback `000000` também foi removido do `verificarEmail` por segurança.
- **Client**: botão "Reenviar código" na tela de verificação com cooldown de 60s. Envio de `codigo` como `Number()` no body.
- **Testes**: 254 server + 42 client (total 296), todos passando.

### 18/08/2026 — Fix vitest hang (jsdom → happy-dom) + cobertura client ≥ 90%

- **Problema**: vitest 4 com jsdom hangava no Windows (workers zumbis que nunca liberam o event loop) — testes passavam mas `vitest run` nunca encerrava. Pre-push hook falhava por timeout.
- **Solução**: `jsdom` → `happy-dom` como `test.environment` no `vite.config.ts`. O happy-dom é mais leve e libera workers limpo. Additionally, `Portal.spec.tsx` (13 testes) foi merged no `App.spec.tsx` — testes separados que renderizam o App completo tinham comportamento instável; consolidar num único arquivo resolveu.
- **Coverage client**: de 85.96% functions → **94.73%** — testes adicionados para `RelatoriosPage`, toggle de senha no `Input`, e abrir/fechar sidebar mobile.
- **Testes client**: 10 → **42** (39 + 3 novos de cobertura).
- **Total**: 293 testes (251 server + 42 client), todos passando.
- **Docs atualizados**: README status, timeline, ARCHITECTURE.md.

### 17/08/2026 — Portal Unificado (Sidebar + Bottom Nav + tema escuro único)

- **Decisão: portal único em vez de portais separados por papel** — o mesmo usuário pode ter múltiplos papéis (ex: ORGANIZER + CLIENT), então um portal unificado com troca de papel é mais flexível. O usuário escolheu **Sidebar + Bottom Nav** como padrão de navegação e **tema escuro único** (sem troca de tema entre papéis).
- **Shell implementado**: `PortalLayout` (sidebar desktop + bottom nav mobile + header), `Sidebar` (seções colapsáveis por papel com ícones SVG inline), `BottomNav` (nav mobile com toggle de papel), `Header` (logo + email + logout).
- **AuthContext**: decodifica JWT via `atob()`, expõe `user: { id, email, roles[] }`, `login()`, `logout()`, `isAutenticado`. Checa expiração do token na inicialização.
- **PortalContext**: `roleAtivo` (papel selecionado), `setRoleAtivo()`, `papeisDisponiveis` (derivado do JWT).
- **Páginas placeholder do organizador**: Dashboard, Eventos, Criar Evento, Relatórios — texto + heading para validar o layout.
- **Placeholder cliente**: "Em breve" para não quebrar se user CLIENT acessar `/portal/cliente`.
- **Rotas no App.tsx**: `/portal/*` protegido por `ProtectedRoute`, com sub-rotas aninhadas em `PortalRoutes` (wrapper do `PortalProvider`).
- **Testes**: 10/10 passando (2 novos: portal autenticado + redirect não autenticado).
- **Docs atualizados**: `ARCHITECTURE.md` seção 3 (Client) reescrita com estrutura de pastas e regras do portal.
- **Como a IA refinou**: corrigiu warnings do oxlint (`exhaustive-deps` — `papeisDisponiveis` criava array novo a cada render → fixado com `useRef`; `only-export-components` → suppress comment). Todas as rotas de fallback do portal redirecionam para `/portal/organizador`.

### 17/08/2026 — Seleção de papel com animação + regra de docs obrigatórios

- **`SelecaoPapelPage`**: nova página em `/registro` com 3 cards (Cliente, Organizador, Portaria). Cada card é um `Link` com ícone SVG, título e descrição. Animação `fade-in-down` com stagger de 150ms via `animation-delay` inline — os 3 botões aparecem um após o outro, descendo com opacidade.
- **Rotas reorganizadas**: `/registro` agora mostra a seleção de papel; o formulário de registro ficou em `/registro/{papel}` (`/registro/cliente`, `/registro/organizador`, `/registro/portaria`). Link "Voltar para seleção de papel" no rodapé de cada formulário.
- **`AGENTS.md` atualizado**: regra inegociável adicionada — `⚠️ ATUALIZE O README.md E O ARCHITECTURE.md` após cada implementação significativa, antes de commitar. Seção 4 reescrita com checklist obrigatória. Checkpoint agora exige docs atualizados antes de avançar.
- **Como a IA refinou**: o usuário apontou que a IA esquecia de atualizar os docs; a solução foi adicionar a regra como inegociável no `AGENTS.md` com alerta visual (⚠️) e linguagem direta, para que a IA não ignore.

### 17/08/2026 — Mobile First + regra de docs obrigatórios

- **Regra Mobile First adicionada ao `AGENTS.md`**: todo layout e componente de UI deve ser projetado primeiro para telas pequenas. Estilos base = mobile; prefixos `sm:`, `md:`, `lg:` apenas para aprimorar em telas maiores.
- **`AuthLayout` ajustado**: padding `p-8` → `p-6 sm:p-8` — card menor no mobile (p/ telas 320px+), maior no desktop. Demais componentes (`Input`, `Button`, páginas) já estavam mobile-first (full-width, stack, touch targets adequados ~48px).
- **Regra de docs obrigatórios reforçada no `AGENTS.md`**: seção 4 reescrita com checklist; checkpoint exige docs atualizados antes de avançar.

### 17/08/2026 — Seleção de papel com animação + regra de docs obrigatórios

- **Backend — `UsuarioRepository.adicionarPapel(usuarioId, nomePapel)`**: novo método que adiciona um `Papeis_Usuario` dentro de `$transaction` (find or create `Papel`). Permite que um usuário existente assuma um novo papel sem duplicar a conta.
- **Backend — `AuthService.registrar()` refatorado**: lógica inteligente — se email não existe, cria user + papel + OTP (fluxo anterior); se email existe e papel não está vinculado, apenas adiciona o papel (reenvia OTP se não verificado); se email existe e papel já está vinculado, ConflictException. Removido catch de `Prisma.PrismaClientKnownRequestError` P2002 — a verificação agora é explícita via `findByEmail`.
- **Segurança — mensagens de erro genéricas**: `'E-mail já cadastrado'` removido (vazava existência); `'E-mail ainda não verificado'` no login unificado para `'Credenciais inválidas'`. Todas as falhas de login agora retornam a mesma mensagem — um atacante não consegue distinguir "email não existe" de "senha errada" de "email não verificado".
- **Frontend — `RegistroPage` com prop `papel`**: componente reutilizado para `/registro` (CLIENT), `/registro/organizador` (ORGANIZER) e `/registro/portaria` (PORTARIA). Título e botão mudam conforme o papel.
- **Frontend — `ProtectedRoute`**: componentes não autenticados (sem `localStorage.token`) são redirecionados para `/login`. Rotas públicas: `/login`, `/registro/*`, `/404`.
- **Checkpoint**: 251 testes, typecheck + lint + build limpos.
- **Como a IA refinou**: detectou que o catch de P2002 era innecessário com a nova lógica explícita; removeu import `Prisma` do service; unificou as mensagens de erro de login (3 branches → 1 mensagem).

### 17/08/2026 — Fix deploy Railway (OpenSSL, tsconfig, porta)

- **Railway server online**: `https://role-brasil-production.up.railway.app` — todos os endpoints funcionando (registro 201, login, rotas públicas).
- **`tsconfig.build.json`** — adicionado `rootDir: "./src"` + `include: ["src"]` para corrigir output do NestJS. Sem essas opções, o `nest build` gerava `dist/src/main.js` (preservando a pasta `src/`) em vez de `dist/main.js` esperado pelo CMD do Dockerfile. A causa era `jest.setup.ts` na raiz do `server/` — arquivos fora de `src/` faziam o TypeScript inferir `rootDir` como `.` (raiz do projeto) ao invés de `./src`.
- **`Dockerfile`** — adicionado `apt-get install -y openssl` antes do `prisma generate`. O `node:22-slim` não vem com OpenSSL; o Prisma client precisa dele para conexão TLS ao Supabase. Sem ele, o server crashava silenciosamente após startup, resultando em 502 no Railway.
- **`railway.json`** — removido `startCommand` (Railway não executa comandos via shell; o `cd` era tratado como executável). O CMD do Dockerfile (`["sh", "-c", "cd server && node dist/main"]`) agora cuida do start.
- **Env var `PORT=3000`** obrigatória no Railway — Dockerfile customizado não herda automaticamente a porta do Railway. Sem essa env var, o server escuta em 3000 (default do `main.ts`) mas o proxy do Railway não roteia corretamente.
- **Como a IA refinou**: diagnóstico iterativo — primeiro removeu `startCommand` (502 por `cd` não encontrado), depois adicionou OpenSSL (502 por crash silencioso do Prisma), depois corrigiu `tsconfig.build.json` (`dist/main.js` não existia) e identificou que `PORT=3000` precisava ser env var explícita.

### 17/08/2026 — Deploy (Vercel + Railway)

- **`vercel.json`**: builda o client com instalação de deps (`npm install --prefix client && npm run build --prefix client`), output `client/dist`, SPA routing via rewrites para React Router.
- **`Dockerfile`**: multi-step build no Railway (substitui Nixpacks) — `COPY . .` antes do `nest build` garante que o `dist/` gerado permanece na imagem. `DATABASE_URL` dummy no step de `prisma generate` (o config exige a variável mas o generate não conecta no banco).
- **`railway.json`**: builder `DOCKERFILE`, restart on failure (máx 10 tentativas). O `startCommand` foi removido — Railway não executa comandos via shell — e o CMD do Dockerfile cuida do start.
- **`.dockerignore`**: exclui `node_modules`, `dist`, `coverage`, `.git` etc. para manter a imagem enxuta.
- **`nixpacks.toml`** removido — não necessário com Dockerfile customizado.
- **Railway**: server NestJS com Prisma, Node 22 via `FROM node:22-slim`, devDeps instaladas para build e depois removidas com `npm prune --omit=dev`.
- **Vercel**: client React SPA, `VITE_API_URL` como env var apontando pro Railway.
- **Migrations pendentes**: `20260817000001_cliente_schema` e `20260817010000_portaria_schema` precisam ser aplicadas no SQL Editor do Supabase antes do deploy.
- **Como a IA refinou**: diagnosticou que o Nixpacks gerava um Dockerfile com `COPY . /app` como step final, sobrescrevendo o `dist/` (gitignored). Migrado para Dockerfile customizado. Em seguida, identificou que `prisma.config.ts` exigia `DATABASE_URL` durante `prisma generate` (mesmo sem conectar no banco) — resolvido passando uma string dummy no step de build. Posteriormente, corrigiu o output do `nest build` (adicionando `rootDir`/`include` ao `tsconfig.build.json`), instalou OpenSSL no container para o Prisma TLS e removeu o `startCommand` do `railway.json`.

### 17/08/2026 — Design System atualizado

- **Nova paleta de cores**: Primary Teal `#00A8B5` substituído por Brand Primary Verde Elétrico `#00FF88` — identidade mais ousada e alinhada ao nome "Rolê Brasil".
- **Tipografia definida**: `Space Grotesk` ou `Syne` para headings (vibe urbana/festiva), `Inter` para body (legibilidade).
- **Dual theme**: Dark Mode para B2C (vitrine/cliente), Light Mode para B2B (dashboard organizador), Dark Mode Extremo para Portaria.
- **Componentes documentados com classes Tailwind**: `<EventCard />`, `<TicketQR />`, `<KpiCard />`, `<SalesChart />`, `<Scanner />`, `<SuccessOverlay />`, `<ErrorOverlay />`, `<PendingDocsOverlay />`.
- **Portaria simplificada**: câmera + input manual + feedback full-screen + haptic feedback, sem PWA offline/IndexedDB.
- **Stack corrigida**: referências a Next.js substituídas por React + Vite (nosso stack real).
- **Libs novas** (Recharts, Chart.js, @tanstack/react-virtual, html5-qrcode) documentadas como requerendo autorização.
- **Como a IA refinou**: manteve a proposta do usuário e aplicou as correções solicitadas (Next.js → React + Vite, remover PWA offline, manter paleta nova).

### 17/08/2026 — Módulo Portaria (backend)

- **Módulo completo**: `portaria/` (repository, service, controller, DTO, specs) — renomeado do stub vazio `validacao/`.
- **Schema**: enum `ResultadoScan` (`APROVADO`, `REJEITADO`, `PENDENTE_DOCUMENTACAO`, `DOCUMENTACAO_CONFIRMADA`, `DOCUMENTACAO_RECUSADA`) + tabela `Portaria_Scans` (log de cada escaneamento com portaria, ingresso, resultado, observação, data).
- **Papel PORTARIA**: adicionado ao `RegistrarDto` como opção de papel (`CLIENT | ORGANIZER | PORTARIA`). Rotas protegidas com `@Roles('PORTARIA')`.
- **Fluxo de validação**: busca por `codigo` (16 chars) → verifica status (`EMITIDO`/`USADO`/`CANCELADO`) → INTEIRA aprova na hora; MEIA/GRATUIDADE sinaliza `PENDENTE_DOCUMENTACAO` → portaria confirma/rejeita comprovante.
- **Histórico**: global (`GET /api/portaria/historico`) e por evento (`GET /api/portaria/historico/:eventoId`).
- **Migration `20260817010000_portaria_schema`**: criada manualmente — **aguardando aplicação no dashboard**.
- **Checkpoint**: 53 suites, 250 testes, typecheck + lint + build limpos.
- **Como a IA refinou**: detectou que o `$transaction` mock recebia array em vez de callback, corrigiu o mock para tx client; removeu `Prisma` import não usado; adicionou `eslint-disable` para `expect.any(Object)`/`expect.any(Date)` que retornam `any`.

### 17/08/2026 — Módulos cliente B1–B7 (backend)

Implementação de todos os módulos backend que suportam o fluxo do cliente. Cada módulo seguiu o padrão repository → service → controller → DTO → specs, com typecheck + lint + testes como checkpoint.

- **B1 — Rotas públicas evento/sessão**: `EventoPublicoController` com `GET /api/eventos/publicos` (filtros ILIKE: título, data, local, preço; paginação) e `GET /api/eventos/publicos/:id` (detalhe com sessões e vagas). Métodos `listarPublicos`/`buscarPublico` no repository.
- **B2 — Módulo favorito**: toggle (`POST /api/favoritos/:eventoId`) e listar IDs (`GET /api/favoritos`). Ownership = 404.
- **B3 — Módulo assento**: mapa de assentos agrupados por fileira (`GET /api/sessoes/:sessaoId/assentos`); busca por IDs.
- **B4 — Módulo reserva**: criar com lock de assentos (`$transaction`), validações (sessão ativa, assentos disponíveis, máx 10 por compra, duplicados), expiração automática (10 min via job background), listar/detalhe com ownership.
- **B5 — Módulo pagamento**: simulação de cartão (CVV "000" = recusa) + PIX (sempre aprova). Transação ao aprovar: Reserva→PAGO, assentos→VENDIDO, ingressos gerados (código de 16 chars + qrToken de 32 chars, cada um com categoria).
- **B6 — Módulo ingresso**: listar por usuário, detalhe com ownership (= 404), cancelamento (até 7 dias antes do evento) com estorno simulado (Pagamento→ESTORNADO, assento→DISPONIVEL, Reserva→CANCELADO).
- **B7 — Módulo mensagem + notification service**: mensagens por evento (`POST/GET /api/eventos/:eventoId/mensagens`), leitura (`PATCH /api/mensagens/:id/lida`), contagem de não lidas (`GET /api/mensagens/nao-lidas`). `NotificationService` com implementação console.log (email simulado). Verificação de participação (ingresso PAGO ou é organizador do evento).
- **Schema**: enum `IngressoStatus` + `CANCELADO`, `PagamentoStatus` + `ESTORNADO`, tabela `Mensagens`. Migration `20260817000001_cliente_schema` — **aguardando aplicação no dashboard**.
- **Checkpoint**: 52 suites, 224 testes (antes dos testes de portaria), typecheck + lint + build limpos.
- **Como a IA refinou**: corrigiu o repository de ingresso para não usar relation inexistente `pagamento` (acessa via `findFirst` pela reserva); ajustou o `$transaction` do repository de reserva para aceitar a callback correta; resolveu conflito de rotas entre `/:eventoId/mensagens` e `/mensagens/nao-lidas` separando em dois controllers.

### 16/08/2026 — Renomeado: Seatly → Rolê Brasil

- **Motivo**: o nome "Seatly" já é usado por um projeto muito semelhante publicado na Vercel — colisão de marca descartada. Um segundo nome candidato ("Primeira Fila") também estava indisponível no GitHub/Vercel, então segui para a opção seguinte.
- **Novo nome — Rolê Brasil**: o portal garante o ingresso pro seu **rolê** com os amigos — o nome entregou imediatamente a essência do produto. Singular, forte em PT-BR e difícil de colidir (composto, nichado).
- **Formatos adotados**: display **Rolê Brasil**; slug/package/repo/pasta `role-brasil`.
- **Alcance da mudança**: `package.json`/`package-lock.json` (raiz), `README.md`, `ARCHITECTURE.md`, `client/README.md`, `server/README.md`, `client/index.html`, `client/src/pages/HomePage.tsx`, `client/src/App.spec.tsx`, comentário no `schema.prisma` e `DESIGN_SYSTEM.md`. Pasta local renomeada; repositório GitHub renomeado (histórico preservado); remote atualizado.
- **Nada de "primeira-fila" ou "Primeira Fila" resta no código** (checado por grep); o histórico git mantém menções anteriores.

### 15/08/2026 — Módulo Organizador (catálogo TMDb + eventos + sessões)

- **Fatia 1 — schema e migration `20260815000002_organizador_fluxo`**: `Evento.excluidoEm`, enum `SessaoStatus {ATIVA, CANCELADA}` e `SessaoEvento.{status, excluidoEm}` — soft delete e cancelamento de evento/sessão sem apagar linhas. **SQL escrito à mão**: o `prisma migrate diff` contra o pooler do Supabase falha com um bug do Prisma/PgBouncer (`prepared statement "s5" already exists`), então migrations simples passam a ser gravadas manualmente. **A aplicação no dashboard ainda depende de mim.**
- **Fatia 2 — papel dinâmico no registro**: `RegistrarDto.papel` (`CLIENT | ORGANIZER`, default `CLIENT`). O `UsuarioRepository.create` recebe o papel e o procura/cria sob demanda na mesma `$transaction` — mesmo padrão que já existia para o `CLIENT`, sem novo acoplamento.
- **Fatia 3 — catálogo TMDb (módulo `catalog`)**: `TmdbAdapter` real com `fetch` (`search`/`getById`, `AbortSignal.timeout(10s)`, 404 → `null`) normalizando para `{id, titulo, descricao, posterUrl, ano}`; `CatalogService` e `GET /api/catalog/buscar?q=` restrito a `ORGANIZER` via `@Roles`. Exige `TMDB_API_KEY` no `.env`.
- **Fatia 4 — eventos (módulo `evento`)**: `POST/GET /api/eventos`, `GET/PATCH/DELETE /api/eventos/:id` e `POST /api/eventos/:id/cancelar|publicar`. Criação nasce `RASCUNHO`; com `tmdbId`, título/sinopse/pôster são snapshotados do catálogo (e podem ser sobrescritos). **Regras de reserva**: evento com qualquer reserva (mesmo cancelada/expirada) só permite editar a `descricao` e só pode ser cancelado; sem reservas edita tudo e permite soft delete. **Cancelar evento cancela as sessões ativas junto** (transação). `GET :id` (dono) devolve métricas — reservas totais/por sessão, valor arrecadado (`Σ subtotalCentavos` de reservas `PAGO`, total e por sessão) e ingressos por categoria — computadas em TS no service a partir das reservas.
- **Fatia 5 — sessões (módulo `sessao`)**: `POST/GET /api/eventos/:eventoId/sessoes` e `PATCH/DELETE /api/sessoes/:id` + `POST /api/sessoes/:id/cancelar`. Sessão com reservas não edita `dataHora` nem é excluída (só cancelada); sem reservas edita e exclui. Evento cancelado não recebe novas sessões.
- **Ownership = 404**: evento/sessão de outro organizador responde `404` (não vaza existência), mesma regra adotada no auth.
- **Infra de testes**: novo `server/jest.setup.ts` (`import 'reflect-metadata'`) referenciado em `setupFiles` — a ordem de imports dos specs quebrava `Reflect.getMetadata` nos DTOs. Detecção de campos enviados no PATCH passou de `Object.keys(dto)` para checagem `!== undefined`: o `target ES2023` emite class fields (todos os campos aparecem como próprios), o que quebraria também em produção.
- **Checkpoint**: typecheck, lint e build limpos; **154 testes / 46 suites — 98.64% stmts / 80.84% branch / 95.96% funcs / 98.4% lines** (thresholds 85/70/85/85).
- **Como a IA refinou**: detectou e corrigiu o bug de `Object.keys` com class fields emitidos (afetaria requests reais), o `Reflect.getMetadata` fora de ordem nos specs, a tipagem de `mock.calls` (array de argumentos) num spec, e ajustou o fluxo de cancelamento para transação única (sessões + evento). Sem novas libs instaladas.

### 15/08/2026 — Autenticação e usuário (registro + verificação de email + login)

- **Fluxo de identidade implementado (primeira funcionalidade do backend)**, escopo aprovado: `POST /api/auth/registro`, `POST /api/auth/verificar-email` e `POST /api/auth/login` (públicos) + `GET/PATCH /api/usuario/me` e `PATCH /api/usuario/me/desativar` (autenticados). Reset de senha fica fora do escopo.
- **Registro já cria o papel `CLIENT` sob demanda** dentro da mesma `$transaction` do usuário (a tabela `Papeis` está vazia; o papel é procurado e criado se ausente). Senha com `bcrypt.hash` (custo 10) — o hash mora no AuthService; o repository não hasheia.
- **JWT com `roles: string[]` no payload** (`sub` + `email` + `roles`), expiração de 7 dias. Guards globais via `APP_GUARD` (`JwtAuthGuard` + `RolesGuard`); o `JwtAuthGuard` foi atualizado para respeitar o decorator `@Public` (usado nas rotas de auth). `main.ts` ganhou `ValidationPipe({ whitelist, transform })` global.
- **Verificação de email por OTP de 6 dígitos com TTL de 10 min** e fallback dev (`ALLOW_OTP_FALLBACK=true`): o código gerado não é retornado na resposta (simula envio real), mas `000000` sempre funciona como bypass. **Login exige email verificado e conta ativa.**
- **Desativação de conta**: coluna `ativo` (`Boolean @default(true)`) em `Usuarios`, via migration `20260815000001_usuario_ativo` — usuário desativado não consegue logar.
- **Cobertura mantida**: 84 testes / 45 suites; **99.7% stmts / 76.7% branch / 100% funcs / 99.6% lines** — thresholds 85/70/85/85 garantidos.
- **Como a IA refinou**: resolveu incompatibilidades de tipagem do tipo-check/lint (erro Prisma via namespace `Prisma.PrismaClientKnownRequestError`; `Reflector` sem `set` na versão do core → teste do `@Public` com `Reflect.defineMetadata`; casts de `expect.any`/`expect.objectContaining` no spec do repository) e consolidou os tipos `UsuarioAutenticado` (do JWT) e `UsuarioLogado` (do login local).

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
- **`verificado`/`codigoVerificacao` na tabela `Usuarios`**: verificação de email por código OTP com TTL 10 min e fallback `000000` em dev (`ALLOW_OTP_FALLBACK=true`) — coerente com o que foi decidido no planejamento. Código não é retornado na resposta (simula envio real).
- **`pagamentos.status` sem estado de processamento pendente**: decisão do desenho — o pagamento é síncrono e determinístico no mock (cartão dígito par aprova, ímpar recusa; Pix sempre aprova), então só existem `APROVADO` e `RECUSADO`. A confirmação só ocorre após o gateway "aprovar".

### 15/08/2026 — Boas práticas de uso de IA

- **Arquivos de contexto para IA (`AGENTS.md` e `ARCHITECTURE.md`)**: decisão de fixar no repositório dois arquivos que documentam como a IA deve trabalhar no projeto — `ARCHITECTURE.md` entrega o contexto/conceito da arquitetura, e `AGENTS.md` entrega o processo de execução (stack, regras negativas, desenvolvimento modular, TDD com cobertura mínima de 85% e checkpoints de typecheck/lint/build/testes entre módulos). A intenção é que a IA opere dentro das mesmas regras e do mesmo entendimento que qualquer desenvolvedor do time, sem "adivinhar" convenções — e que isso seja versionado junto com o código.

### 15/08/2026 — Configuração inicial (scaffold)

- **Gerador Prisma `prisma-client-js` (clássico) em vez do `prisma-client` (novo)**: o `prisma init` 6.19 gera por padrão o gerador novo, que escreve o client em TS dentro do repo (`server/generated/`). Como o tsconfig do Nest compila tudo que está fora de `node_modules`, esse código gerado entrava no build e deslocava a raiz de compilação — resultado: `dist/src/main.js` em vez do `dist/main.js` esperado pelo NestJS (e o `start:prod` quebrava). Trocar para `prisma-client-js` mantém o client em `node_modules`, fora do build, e o layout `dist/main.js` padrão. Custo aceito: ao migrar para Prisma 7 no futuro, o gerador novo será o caminho.
- **Node.js >= 22.12.0 exigido pelo Vite 8 (rolldown) e pelo oxlint**: na primeira instalação, o build e o lint do client quebraram com "Cannot find native binding". A causa não é um bug do npm nesta máquina, e sim o *engine check*: os bindings nativos (`@rolldown/binding-*`, `@oxlint/binding-*`) declaram `node: ^20.19.0 || >=22.12.0`, e o Node instalado (22.11.0) não atendia — npm pula dependência opcional que falha no engine de forma silenciosa, sem erro. **Decisão: atualizar o Node para a versão LTS mais recente** em vez de fazer workaround no package.json (pin de binding por plataforma), que exigiria manter versão sincronizada manualmente a cada update. Fica registrado aqui porque um erro enigmático de "binding" costuma ser mal diagnosticado.
- **Stack obrigatória + monorepo `client`/`server`**: React com TypeScript no front, NestJS no back, Supabase (Postgres) como banco. Escolha direta do enunciado.
- **Nome do projeto — inicialmente "Seatly"**: remetia ao "assento garantido" — a garantia de que o lugar escolhido é seu é o coração do produto. Nome curto, fácil de lembrar e que marca o domínio sem soar genérico. **Posteriormente renomeado para "Rolê Brasil"** (16/08/2026) por colisão de marca com projeto semelhante na Vercel — ver entrada no topo da timeline.
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

Todas as decisões de arquitetura e escopo deste projeto foram tomadas por mim (humano) e registradas acima. A IA foi usada como parada técnica: implementou as fatias aprovadas (autenticação/usuário e, depois, o módulo organizador), sempre dentro das regras e padrões fixados no projeto, e não decidiu escopo.

Para garantir que a IA trabalhe dentro das regras e do contexto do projeto, o repositório inclui dois arquivos: **`AGENTS.md`** (processo de execução — stack, regras negativas, desenvolvimento modular, TDD com cobertura ≥ 85% e checkpoints de validação entre módulos) e **`ARCHITECTURE.md`** (conceito da arquitetura). Ambos são lidos e seguidos pelos agentes de IA durante o desenvolvimento.
