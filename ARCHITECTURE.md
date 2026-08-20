# Rolê Brasil — Arquitetura

> Documento de conceito. Define os princípios, o formato e os limites do sistema. O modelo de dados concreto vive no schema Prisma (seção 5).
> Para decisões com contexto (o porquê de cada escolha) e como rodar, ver o [README](./README.md).
> Princípios de qualidade de código (KISS, DRY, Clean Code, SOLID, composição sobre herança, Lei de Demeter, padrões GoF) e o pipeline de validação local (husky) são governados pelo [AGENTS.md](./AGENTS.md).

## 1. Visão geral

O Rolê Brasil é uma plataforma de eventos e ingressos com três papéis:

- **Organizador** — monta eventos a partir de um catálogo externo, define sessões, preços por categoria, mapa de assentos e publica. Acompanha ocupação e vendas.
- **Cliente** — busca eventos, escolhe sessão, assento e categoria, paga de forma simulada (Pix ou cartão) e recebe um ingresso com QR assinado, que pode compartilhar por link.
- **Portaria** — valida o ingresso na entrada lendo o QR pela câmera ou digitando o código, com resposta clara (válido, inválido, já utilizado, evento/sessão errados).

**Princípios que governam tudo:**

1. **O backend é a fonte da verdade.** Toda regra de negócio (preço, disponibilidade, validação, anti-fraude) vive no NestJS. O frontend só apresenta e envia intenções.
2. **Supabase é Postgres gerenciado, nada mais.** Banco como serviço; identidade, regras e integridade são responsabilidade da aplicação.
3. **Segurança por design.** Ingresso não-forjável por assinatura, consumo atômico para impedir uso duplo, unicidade no banco para impedir dupla-venda.
4. **Simulação determinística.** Onde o escopo pede simulação (pagamento, verificação, envio de email), ela é previsível e documentada — não aleatória.
5. **Proporcionalidade.** Nada de infraestrutura que o escopo não justifica. Cada componente existe porque um fluxo do produto precisa dele.

## 2. Stack e monorepo

```
┌──────────────────────────────────────────────────────────────┐
│                       Rolê Brasil (repo)                       │
│                                                              │
│   package.json (raiz)  —  orquestra com concurrently         │
│        │                                                      │
│        ├── client/   React 19 · TypeScript · Vite 8          │
│        │            Tailwind 4 · React Router 7              │
│        │            (porta 5173, proxy /api → :3000)         │
│        │                                                      │
│        └── server/   NestJS 11 · Prisma · Supabase Postgres  │
│                     JWT (Passport) · bcrypt · qrcode         │
│                     (porta 3000, prefixo global /api)        │
└──────────────────────────────────────────────────────────────┘
```

- **Monorepo sem npm workspaces**: `client` e `server` são pacotes independentes, com lockfiles próprios. O root apenas sobe os dois juntos (`npm run dev`). Evita hoisting de dependências (surpresas com NestJS/Vite) e mantém cada lado versionável isolado.
- **Comunicação**: o client fala com o server sempre via `/api`. Em dev, o Vite proxeia `/api` para `:3000`; em produção, o mesmo prefixo garante URLs consistentes.
- **Qualidade local (husky)**: hooks de git na raiz — `pre-commit` roda lint, typecheck e build dos dois pacotes; `pre-push` roda testes + cobertura (Jest no server, Vitest no client) com thresholds que bloqueiam o push. Meta de 85%, início em ramp-up (valores no `README`).

## 3. Client (React + Vite)

```
src/
├── api.ts                 Helper fetch com auth (api<T>(path, init))
├── pages/
│   ├── portal/
│   │   ├── organizador/ Dashboard, Eventos, DetalheEvento, NovoEvento, EditarEvento, Relatorios
│   │   ├── cliente/     InicioPage, DetalheEventoPage, IngressosPage, DetalheIngressoPage, FavoritosPage
│   │   └── portaria/    ValidarPage, HistoricoPage
│   ├── MeuPerfilPage.tsx       (rota /portal/perfil — todos os papéis)
│   ├── CompartilharIngressoPage.tsx   (rota pública /ingressos/compartilhar/:codigo)
│   ├── LoginPage.tsx, RegistroPage.tsx, SelecaoPapelPage.tsx
│   ├── HomePage.tsx
│   └── NotFoundPage.tsx
├── components/
│   ├── auth/            AuthLayout, ProtectedRoute
│   ├── portal/          PortalLayout, Sidebar, Header
│   └── ui/              Button, Input, Card, StatusBadge, EmptyState
├── contexts/
│   ├── AuthContext.tsx   Decodifica JWT, user { id, email, roles[] }
│   ├── PortalContext.tsx roleAtivo, papeisDisponiveis
│   └── ToastContext.tsx  toast.success/error/info — notificações leves
└── test-utils.ts        criarTokenFake() helper
```

Regras:

- **Portal unificado**: um único shell (sidebar + bottom nav) serve todos os papéis. O papel ativo é controlado por `PortalContext` e muda o conteúdo/rotas exibidos, não o layout.
- **Sidebar (slide-over mobile + fixa desktop)**: sidebar fixa à esquerda em telas ≥ lg. No mobile, funciona como slide-over — abre via botão hamburger no Header, com backdrop escuro, fecha ao clicar fora ou ao navegar.
- **Role-gating no front é parcialmente enforceado.** `ProtectedRoute` valida papel contra a rota (CLIENT→`/portal/cliente/*`, ORGANIZER→`/portal/organizador/*`, PORTARIA→`/portal/portaria/*`), redirecionando para `/portal` se o papel não bater. Mas a autorização real é feita pelos guards no backend.
- O client nunca decide preço, disponibilidade ou validade — ele exibe o que o server responde.
- Estado de autenticação em `AuthContext`; token em `localStorage`; toda chamada protegida envia `Authorization: Bearer <token>`.
- Tema escuro único — não há troca de tema entre papéis; shell e conteúdo são sempre dark.

### Páginas do Portal do Cliente

- **InicioPage** (`/portal/cliente`): busca de eventos públicos com filtros (texto, cidade, estado, data, preço) e paginação. Cards com poster, endereço, categorias, próxima sessão.
- **DetalheEventoPage** (`/portal/cliente/evento/:id`): state machine de compra — INFO → ASSENTOS → RESERVA → CONFIRMAÇÃO. Info do evento, mapa de assentos estilo teatro (palco visual, curvatura progressiva, labels duplos), categorias dinâmicas filtradas por evento, timer de expiração (10 min), pagamento (PIX/cartão), confirmação. Favoritos toggle. Chat integrado para quem tem ingresso (polling 10s).
- **FavoritosPage** (`/portal/cliente/favoritos`): grid de eventos favoritados com poster, título, categorias, endereço, próxima sessão. Backend `GET /api/favoritos/eventos` retorna eventos completos.
- **IngressosPage** (`/portal/cliente/ingressos`): lista de ingressos do cliente com filtros por status (EMITIDO, PENDENTE, TODOS).
- **DetalheIngressoPage** (`/portal/cliente/ingressos/:id`): detalhe do ingresso com QR code, código de 16 chars, cancelamento com confirmação dupla (até 7 dias antes do evento).

### Páginas do Portal do Organizador

- **DashboardPage**: KPI cards + eventos por status + últimos eventos.
- **EventosPage**: listagem de eventos do organizador com poster, sessões, status.
- **DetalheEventoPage**: métricas, endereço, categorias, sessões, ações (Publicar/Cancelar/Excluir), form inline para sessão com loader.
- **NovoEventoPage**: multi-step — busca TMDb, dados do evento, endereço, categorias dinâmicas.
- **EditarEventoPage**: form com proteção — se evento tem reservas, só edita descrição.
- **RelatoriosPage**: métricas detalhadas por evento (reservas por sessão com receita, ingressos por categoria).

### Páginas do Portal da Portaria

- **ValidarPage** (`/portal/portaria`): input para código do ingresso + botão "Escanear QR Code" que abre câmera via `html5-qrcode`. Valida via `POST /portaria/validar`, exibe resultado (APROVADO/PENDENTE_DOCUMENTACAO/REJEITADO) com `<StatusBadge>` e detalhes do ingresso em `<Card>` colorido.
- **HistoricoPage** (`/portal/portaria/historico`): lista cronológica de scans realizados pelo portaria logado, com `<StatusBadge>` por resultado e `<EmptyState>` quando vazio.
- **QR Scanner** (`components/ui/QRScanner.tsx`): componente fullscreen que usa `Html5Qrcode` para ler QR pela câmera do dispositivo. Ao detectar, chama `onScan(decodedText)` e encerra a câmera.
- **Modo kiosk / fullscreen**: botão na `Header` visível apenas para papel PORTARIA. Usa Fullscreen API para esconder barra do navegador — ideal para tablet na entrada do evento.

### Página compartilhada

- **MeuPerfilPage** (`/portal/perfil`): exibe informações do usuário (nome, email, função, data de criação), permite editar o nome e alterar a senha. Disponível para todos os papéis (CLIENT, ORGANIZER, PORTARIA) via sidebar.

## 4. Server (NestJS) — mapa de módulos

```
                        ┌────────────┐
                        │   Prisma   │  acesso ao Postgres (Supabase)
                        └─────┬──────┘
                              ▲
        ┌────────┬────────┬───┴───┬────────┬─────────┬──────────┬──────┐
        │        │        │       │        │         │          │      │
     ┌──┴──┐ ┌──┴──┐ ┌───┴──┐ ┌──┴───┐ ┌──┴──┐ ┌───┴───┐ ┌───┴──┐ ┌──┴───┐
     │Auth │ │Catalog│ │Evento│ │Sessao│ │Assento│ │Reserv.│ │Pagam.│ │Portar.│
     └──┬──┘ └──┬──┘ └───┬──┘ └──┬───┘ └──┬──┘ └───┬───┘ └───┬──┘ └───┬──┘
        │       │        │       │        │        │         │        │
        └───────┴────────┴───────┴────────┴────────┴────┬────┴────────┘
                                                         │
                                              ┌──────────┼──────────┐
                                              ▼          ▼          ▼
                                         Ingresso   Favorito   Mensagem
                                              │
                                         ┌────┴────┐
                                         │         │
                                    Portaria   (Stats)
```

- **auth** — registro com verificação de email, login (passport-local + JWT), estratégias e guards por papel. **Implementado** — registro inteligente: se email já existe e papel não está vinculado, adiciona o papel (sem duplicar usuário); se papel já está vinculado, Conflict. Mensagens de erro genéricas para evitar vazamento de existência de contas.
- **catalog** — adapter para o TMDb (`CatalogProvider`): busca e detalhe de filmes, normalizados para um formato próprio; extensível para Ticketmaster. **Implementado** (`TmdbAdapter` com `fetch`, `GET /api/catalog/buscar`).
- **events** — CRUD do organizador: montar evento a partir do catálogo, definir local, categorias de ingresso e preços, publicar/cancelar. **Implementado** — com reservas só edita a descrição e só cancela; sem reservas edita tudo e soft-deleta; `GET :id` devolve métricas; `GET /api/eventos/publicos` para busca pública com filtros ILIKE.
- **sessions / seats** — um evento tem várias sessões (data/hora). Cada sessão tem seu mapa de assentos, gerado a partir da configuração de fileiras. A unicidade de um lugar por sessão é garantida por constraint de banco. **Implementado** — CRUD de sessões com regras de reserva; mapa de assentos agrupados por fileira.
- **reservations** — hold de assentos com validade (10 min): o cliente seleciona lugares e categorias, vê o subtotal, e os assentos ficam `reservados` até o pagamento ou expiração. **Implementado** — criação com `$transaction` e lock de assentos; expiração automática via scheduler (`ReservaExpirationScheduler` roda a cada 60s); listagem/detalhe com ownership.
- **payments** — provedor **simulado** com regra determinística: cartão com CVV "000" é recusado; Pix sempre aprovado. **Implementado** — transação ao aprovar (reserva→PAGO, assentos→VENDIDO, ingressos gerados); transação ao recusar (reserva→CANCELADO, assentos→DISPONIVEL).
- **tickets** — emissão do ingresso com código de 16 chars (base64url) e `qrToken` de 32 chars (hex). **Implementado** — listar por usuário, detalhe com ownership, cancelamento (até 7 dias antes do evento) com estorno simulado, compartilhamento público (`GET /api/ingressos/publico/:codigo` com QR em base64).
- **portaria** — valida por código (16 chars) ou qrToken; consumo atômico impede uso duplo; fluxo em 2 fases para meia-entrada/gratuidade; `eventoId` opcional para validar que o ingresso pertence ao evento selecionado. **Implementado** — registro de scan, confirmação/rejeição de comprovante (atomicamente via `$transaction` no repository), histórico global e por evento. Frontend: `ValidarPage` com botões Confirmar/Rejeitar quando resultado é `PENDENTE_DOCUMENTACAO`.
- **favorites** — eventos salvos pelo cliente. **Implementado** — toggle (adicionar/remover), listar IDs favoritados.
- **messages** — mensagens por evento (bidirectional cliente ↔ organizador); leitura e contagem de não lidas. **Implementado** — envio, listagem, marcar como lida, contagem de não lidas.
- **stats** — painel do organizador: ocupação por sessão, ingressos vendidos por categoria e receita. **Implementado** — `GET /api/stats/organizador` agrega métricas de todos os eventos do organizador.

**Seed data** (`server/prisma/seed.ts`): `npx prisma db seed` popula 4 usuários (organizador, 2 clientes, 1 portaria, todos com senha `Senha@123`), 1 evento publicado "Rock in Rio 2026" com 2 sessões (60 assentos cada, fileira A×E, 12 por fileira) e 3 categorias (INTEIRA/R$300, MEIA/R$150, GRATUIDADE/Grátis).

**Mapeamento para o scaffold atual (`server/src/`):**

| Módulo | Pasta | Observações |
|---|---|---|
| auth | `auth/` | **implementado** — `auth.service.ts`, `auth.controller.ts`, `strategy/` (JWT + local), `dto/`, `types/` |
| usuario | `usuario/` | **implementado** — `usuario.repository.ts`, `usuario.service.ts`, `usuario.controller.ts`, `dto/` |
| catalog | `catalog/` | **implementado** — `providers/` (`TmdbAdapter` + `CatalogProvider`), `catalog.service.ts`, `catalog.controller.ts`, `dto/` |
| evento | `evento/` | **implementado** — `evento.repository.ts`, `evento.service.ts`, `evento.controller.ts`, `evento-publico.controller.ts`, `dto/` |
| sessao | `sessao/` | **implementado** — `sessao.repository.ts`, `sessao.service.ts`, `sessao.controller.ts`, `dto/` — criação auto-gera assentos via `$transaction` |
| assento | `assento/` | **implementado** — `assento.repository.ts`, `assento.service.ts`, `assento.controller.ts` |
| reserva | `reserva/` | **implementado** — `reserva.repository.ts`, `reserva.service.ts`, `reserva.controller.ts`, `dto/` |
| pagamento | `pagamento/` | **implementado** — `pagamento.repository.ts`, `pagamento.service.ts`, `pagamento.controller.ts`, `dto/` |
| ingresso | `ingresso/` | **implementado** — `ingresso.repository.ts`, `ingresso.service.ts`, `ingresso.controller.ts` — inclui endpoint público de compartilhamento |
| portaria | `portaria/` | **implementado** — `portaria.repository.ts`, `portaria.service.ts`, `portaria.controller.ts`, `dto/` |
| favorito | `favorito/` | **implementado** — `favorito.repository.ts`, `favorito.service.ts`, `favorito.controller.ts` — toggle + listar IDs + listar eventos completos |
| mensagem | `mensagem/` | **implementado** — `mensagem.repository.ts`, `mensagem.service.ts`, `mensagem.controller.ts`, `mensagem-global.controller.ts` |
| stats | `stats/` | **implementado** — `stats.service.ts`, `stats.controller.ts` |
| infra | `common/` | decorators `@Roles`/`@Public`, guards JWT/papéis, `NotificationService` |
| infra | `prisma/` | `PrismaService`/`PrismaModule` (global) |
| infra | `utils/` | utilitários (OTP, centavos) |

### Módulo organizador (catalog + evento + sessao)

- **Ownership = 404**: qualquer id de evento/sessão de outro organizador responde `404` (não vaza existência) — mesmo padrão usado no auth.
- **Regras de reserva**: evento/sessão **com qualquer reserva** (qualquer status) só permite cancelar — no evento ainda cabe editar apenas a `descricao`; **sem reservas** edita tudo e permite soft delete (`excluidoEm`, some da plataforma sem apagar a linha). Evento `CANCELADO` não recebe novas sessões e não volta a `PUBLICADO`.
- **Cancelar evento = transação**: sessões `ATIVA` viram `CANCELADA` e o evento vira `CANCELADO` numa única `$transaction`.
- **Métricas em `GET /api/eventos/:id`** (dono): `reservasTotais`, `reservasPorSessao`, `valorArrecadado` (= `Σ subtotalCentavos` de reservas `PAGO`), `valorArrecadadoPorSessao`, `ingressosPorCategoria` e `ingressosPorCategoriaPorSessao` — computadas em TS no `EventoService` a partir de um `findMany` enxuto de reservas (KISS, sem SQL raw).
- **Snapshot do TMDb**: com `tmdbId`, título/sinopse/pôster vêm do catálogo e podem ser sobrescritos pelo organizador; o evento sobrevive se a API externa cair.
- **Papel dinâmico**: o registro aceita `papel: 'CLIENT' | 'ORGANIZER' | 'PORTARIA'` — o papel é buscado/criado sob demanda na mesma transação do usuário. Se o email já existe e o papel não está vinculado, apenas adiciona o `Papeis_Usuario` (sem duplicar o usuário). N:N mantido para permitir que um usuário assuma múltiplos papéis sem re-registro.

### Autenticação e papéis

- JWT assinado pelo servidor com payload `{ sub, email, roles[] }` — papéis: `ORGANIZER`, `CLIENT`, `PORTARIA`. Expiram em 7 dias.
- **Guards globais** (`APP_GUARD`): `JwtAuthGuard` exige token por padrão e respeita `@Public`; `RolesGuard` + decorator `@Roles(...)` restringem rotas por papel (ex.: criar evento exige `ORGANIZER`; validar ingresso exige `PORTARIA`; reservar exige `CLIENT`).
- **Reset de senha**: `POST /auth/esqueci-senha` gera OTP para o email; `POST /auth/redefinir-senha` valida OTP e atualiza senha. `PATCH /usuario/me/senha` altera senha do usuário logado (exige senha atual). OTP bypass: `000000` sempre funciona (hardcoded).
- **Registro inteligente**: `RegistrarDto.papel` (`CLIENT | ORGANIZER | PORTARIA`, default `CLIENT`). Se o email já existe e o papel não está vinculado, o sistema adiciona o papel (sem duplicar usuário). Se o papel já está vinculado, retorna Conflict. Mensagens de erro genéricas (`'Credenciais inválidas'`, `'Não foi possível realizar o cadastro'`) — nunca revelam se uma conta existe ou não.
- Verificação de email por **OTP de 6 dígitos (TTL 10 min)**. Em dev (`ALLOW_OTP_FALLBACK`), o código `000000` sempre funciona — o código gerado não é retornado na resposta (simula envio real de email). Novo endpoint `POST /auth/reenviar-codigo` gera novo OTP para usuários não verificados.
- **Login exige email verificado e conta ativa**; usuário desativado (coluna `ativo`) não autentica. Todas as falhas de login retornam `'Credenciais inválidas'` (uniforme, sem vazamento).

## 5. Modelo de dados (Prisma)

> Fonte da verdade: `server/prisma/schema.prisma` (migração inicial versionada em `server/prisma/migrations/`). Tabelas em snake_case, enums nativos no banco.

**Tabelas (15):**

| Grupo | Tabelas | Papel |
|---|---|---|
| Identidade | `Usuarios`, `Papeis`, `Papeis_Usuario` | conta com papéis N:N (Organizador/Cliente/Portaria); `verificado` + campos de OTP + `ativo` (desativação de conta) |
| Catálogo do organizador | `Eventos`, `Enderecos_Eventos`, `Categorias_Evento` | evento snapshotado do TMDb; endereço 1:1; catálogo de preços por categoria (INTEIRA/MEIA/GRATUIDADE) |
| Sessão e assentos | `Sessao_Eventos`, `Assentos_Sessao` | sessões múltiplas por evento; mapa de assentos com estado por sessão |
| Venda | `Reservas`, `Reservas_Itens`, `Pagamentos` | hold de 10 min; um item por assento com preço congelado; pagamento mock determinístico |
| Pós-venda | `Ingressos`, `Favoritos` | ingresso com código curto + token do QR; favoritos por cliente |
| Comunicação | `Mensagens` | mensagens por evento (bidirectional cliente ↔ organizador) |
| Portaria | `Portaria_Scans` | log de cada escaneamento na entrada (resultado, data, portaria responsável) |

**Constraints que sustentam a integridade:**

- `UNIQUE(sessao_id, fileira, numero)` — um lugar existe uma única vez por sessão; dupla-venda é impossível por constraint, não por lógica de aplicação.
- `UNIQUE(assento_sessao_id)` em `Reservas_Itens` e `Ingressos` — um assento não entra em duas reservas nem vira dois ingressos.
- `UNIQUE(email)`, `UNIQUE(Papeis_Usuario.usuario_id, papel_id)`, `UNIQUE(Ingressos.codigo)`, `UNIQUE(Favoritos.usuario_id, evento_id)` e `UNIQUE(Categorias_Evento.evento_id, nome)` (uma categoria de cada por evento).
- `categoria`/`preco_centavos` são **denormalizados** em itens e ingressos: congelam o valor na compra e evitam join na validação da portaria.
- `Mensagens` indexadas em `evento_id` e `remetente_id` para buscas por evento.
- `Portaria_Scans` indexadas em `portaria_id` e `ingresso_id` para histórico por portaria e por ingresso.

**Enums:** `EventoStatus`, `SessaoStatus`, `CategoriaIngresso`, `AssentoStatus`, `ReservaStatus`, `IngressoStatus`, `ComprovanteStatus`, `PagamentoTipo`, `PagamentoStatus`, `ResultadoScan`.

**Notas de desenho:**

- `PagamentoStatus` ganhou `ESTORNADO` (além de `APROVADO`/`RECUSADO`): o estorno é simulado no cancelamento de ingresso.
- `IngressoStatus` ganhou `CANCELADO` (além de `EMITIDO`/`USADO`): ingresso cancelado pelo cliente (até 7 dias antes do evento).
- `ComprovanteStatus` materializa o fluxo de 2 fases da portaria (`PENDENTE` → `CONFIRMADO`/`RECUSADO`).
- `ResultadoScan` registra o resultado de cada escaneamento na portaria (`APROVADO`, `REJEITADO`, `PENDENTE_DOCUMENTACAO`, `DOCUMENTACAO_CONFIRMADA`, `DOCUMENTACAO_RECUSADA`).
- A migração inicial foi gerada com `prisma migrate diff` e está versionada; a aplicação ao banco fica pendente da `DATABASE_URL` real.
- `20260815000001_usuario_ativo` adiciona `Usuarios.ativo` (`Boolean @default(true)`) — aplicada manualmente no dashboard do Supabase e registrada com `prisma migrate resolve`.
- `20260815000002_organizador_fluxo` adiciona `Eventos.excluido_em` e `Sessao_Eventos.{status, excluido_em}` (enum `SessaoStatus`) — SQL escrito manualmente; **aguardando aplicação no dashboard + `migrate resolve`**.
- `20260817000001_cliente_schema` adiciona tabela `Mensagens` + `IngressoStatus.CANCELADO` + `PagamentoStatus.ESTORNADO` — **aguardando aplicação no dashboard**.
- `20260817010000_portaria_schema` adiciona tabela `Portaria_Scans` + enum `ResultadoScan` — **aguardando aplicação no dashboard**.

## 6. Segurança do ingresso

```
   QR gerado com ──────▶  código de 16 chars (base64url)
   randomBytes(12)        + qrToken de 32 chars (hex)
   (não forjável pelo     gerados na emissão do ingresso
    cliente)
                                   │
       Validação na portaria ──────┤
       (código de 16 chars ou      │
        token de 32 chars hex)     │
                                   ▼
                  ┌────────────────────────────────┐
                  │  busca por codigo (único)       │
                  │  → status do ingresso determina │
                  │    APROVADO / REJEITADO /       │
                  │    PENDENTE_DOCUMENTACAO        │
                  └────────────────────────────────┘
```

- O ingresso é identificado por um **código de 16 chars** (base64url uppercase) para digitação manual, ou um **qrToken de 32 chars** (hex) se decodificado do QR.
- A validação busca o ingresso por `codigo` (unique) e verifica o `status`:
  - `EMITIDO` → pode ser validado
  - `USADO` → REJEITADO (já utilizado)
  - `CANCELADO` → REJEITADO (cancelado pelo cliente)
- A venda dupla de um mesmo lugar é impedida por **constraint de unicidade no banco**, no nível mais forte possível — não por lógica de aplicação.

### Validação em 2 fases (meia-entrada / gratuidade)

```
        scan do ingresso (código ou qrToken)
                    │
                    ▼
      ingresso pede comprovante?  ──não──▶  APROVADO (consome agora)
                    │sim
                    ▼
      PENDENTE_DOCUMENTACAO (não consome; log scan)
                    │
       portaria examina o comprovante
                    │
           ┌────┴─────┐
           │          │
      Confirmado    Recusado
           │          │
           ▼          ▼
      APROVADO    REJEITADO
    (consome)    (não consome;
                  registra tentativa)
```

- Ingressos `INTEIRA` são validados de uma vez (marca `USADO` + `usadoEm`).
- Ingressos `MEIA`/`GRATUIDADE`: o scan sinaliza `PENDENTE_DOCUMENTACAO` e **não** consome o ingresso; a portaria confere o comprovante e decide **Confirmado** (consome atomicamente) ou **Recusado** (não consome, fica registrado para auditoria via `Portaria_Scans`).

## 7. Fluxos que moldam a arquitetura

### Reserva → pagamento → ingresso

```
  cliente escolhe sessão
        │
        ▼
  seleciona assentos (categoria por lugar) ──▶ subtotal no cliente
        │
        ▼
  reserva com hold de 10 min (assentos reservados)
        │
        ▼
  pagamento: PIX (sempre aprova)  ou  CARTÃO (dígito ímpar recusa)
        │
   ┌────┴──────────┐
   ▼               ▼
aprovado        recusado
   │               │
   ▼               ▼
assentos VENDIDOS  assentos LIBERADOS
ingressos emitidos reserva cancelada
(QR assinado)
```

- O pagamento **nunca** toca dinheiro real: é um mock com regra documentada, para que os dois caminhos (sucesso e falha) sejam demonstráveis de forma previsível.
- Se o cliente abandona o checkout, o hold expira e os assentos voltam a ficar disponíveis.

### Portaria (implementada)

```
   POST /api/portaria/validar
   { codigo: "ABC123XYZ789DEFG" }
              │
              ▼
   server busca ingresso por codigo
              │
     ┌────────┼────────┬──────────┐
     ▼        ▼        ▼          ▼
  não      USADO    CANCELADO   encontrado
  existe    │        │
     │      ▼        ▼
     │   REJEITADO  REJEITADO
     │   (log)      (log)
     │
     ▼
  categoria?
  ┌──────┴──────┐
  ▼             ▼
INTEIRA    MEIA/GRATUIDADE
  │             │
  ▼             ▼
APROVADO    PENDENTE_DOCUMENTACAO
(consome)   (não consome)
  │             │
  ▼             ▼
log scan     POST /api/portaria/comprovantes/:id/confirmar
             POST /api/portaria/comprovantes/:id/rejeitar
                  │
                  ▼
             DOCUMENTACAO_CONFIRMADA → APROVADO (consome)
             DOCUMENTACAO_RECUSADA  → REJEITADO (não consome)
```

- **Rotas** (todas exigem JWT + `@Roles('PORTARIA')`):
  - `POST /api/portaria/validar` — `{ codigo, eventoId? }` → valida ingresso (eventoId opcional para validar que pertence ao evento selecionado)
  - `POST /api/portaria/comprovantes/:id/confirmar` — confirma documentação
  - `POST /api/portaria/comprovantes/:id/rejeitar` — rejeita documentação
  - `GET /api/portaria/historico` — histórico global do portaria logado
  - `GET /api/portaria/historico/:eventoId` — histórico filtrado por evento
- **Cada escaneamento** gera um registro em `Portaria_Scans` com resultado, data e observação (motivo do REJEITADO, etc.).
- **Ingressos `INTEIRA`** são validados de uma vez (marca `USADO` + `usadoEm`).
- **Ingressos `MEIA`/`GRATUIDADE`**: o scan sinaliza `PENDENTE_DOCUMENTACAO` e **não** consome o ingresso; a portaria confere o comprovante e decide **Confirmado** (consome atomicamente via `$transaction`) ou **Recusado** (não consome).

### Compartilhamento

```
  cliente toca "compartilhar"
        │
        ▼
  navigator.share() ou copia link
        │
        ▼
  link público /ingressos/compartilhar/:codigo
        │
        ▼
  backend gera QR com randomBytes + monta
  data URL (qrcode package, sem API externa)
        │
        ▼
  qualquer pessoa vê o ingresso + QR
  (sem dados de conta)
```

- **Rota pública** `GET /api/ingressos/publico/:codigo` (`@Public()`) — retorna dados do ingresso + `qrDataUrl` (data URL com QR em base64). Não expõe dados da conta do titular.
- **QR gerado no servidor** usando o pacote `qrcode` — sem dependência de API externa (api.qrserver.com).

## 8. Catálogo externo

```
        ┌───────────────────┐
        │  CatalogProvider  │  interface comum (search / getById)
        └─────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   TMDbAdapter         (TicketmasterAdapter — futuro)
   ──────────
   filmes: pôster, sinopse, gênero, ano
```

- O organizador monta o evento a partir de um item do catálogo. O item é **snapshotado** para o banco no momento da criação — o evento sobrevive e é exibido mesmo se a API externa falhar ou a chave expirar.
- A interface `CatalogProvider` isola o TMDb; plugar Ticketmaster no futuro é criar um novo adapter.

## 9. UX e design system

O design system segue paleta `#00FF88` (verde elétrico) sobre fundo escuro (`slate-950`), com tipografia **Space Grotesk** para headings e **Inter** para corpo. Tema escuro único (sem toggle light/dark).

Componentes compartilhados em `client/src/components/ui/`:

| Componente | Propósito |
|---|---|
| `Button` | Loading com `sr-only` text para acessibilidade |
| `Input` | Ícone opcional, mensagens de erro, variante dark |
| `StatusBadge` | Labels human-readable (ex.: "Pendente Doc.") em vez de enums brutos |
| `EmptyState` | Ícone semântico (📋) + botão de retry |
| `ConfirmDialog` | Modal de confirmação reutilizável (variante perigo/padrão) |
| `Card`, `Modal`, `Select`, `TextArea` | Primitivos de layout |

Hooks compartilhados:

| Hook | Propósito |
|---|---|
| `useDocumentTitle` | Define `document.title` com cleanup automático |
| `useBeforeUnload` | Avisa antes de sair com mudanças não salvas |
| `useToast` | Notificações leves (success/error/info) — sem lib externa |

Utility: `formatarCentavos` em `client/src/utils/formatarCentavos.ts` — formata centavos como `R$ XX,XX` sem separador de milhar.

**Heurísticas de Nielsen aplicadas (124 problemas identificados → todos corrigidos):**
- Confirmação em ações destrutivas (`ConfirmDialog`)
- Feedback pós-ação (mensagem de sucesso/erro visível via Toast)
- Retry em estados de erro
- Botão Voltar em páginas de criação/edição
- Unificação de componentes (Input, Button, StatusBadge)
- Máscara em campos de pagamento (cartão, CVV, validade)
- Validações visíveis (senha, data, sessões para publicar)
- Filtros e busca em listas (EventosPage, Histórico)
- Feedback de estados vazios e loading

## 10. Fora do escopo (deliberado)

| Item | Por quê |
|---|---|
| Código de empresa / multi-tenancy | Papel do usuário é suficiente; contexto de empresa não adiciona valor ao escopo do desafio |
| Email real (verificação/reset) | Substituído por OTP simulado com fallback dev — demonstra o fluxo sem infra |
| Provedor de pagamento real | Substituído por mock determinístico |
| Assentos em tempo real (websockets) | A consulta a cada interação já é suficiente; reserva com hold evita corrida |
| Nota fiscal, revenda, app nativo | Fora do enunciado |
| Banco não-relacional ou cache distribuído | Sem caso de uso que justifique |

## 11. Ligações

- **Decisões com contexto e linha do tempo** → [README](./README.md)
- **Modelo de dados e migração** → `server/prisma/schema.prisma` + `server/prisma/migrations/`
