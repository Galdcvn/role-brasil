# Seatly — Arquitetura

> Documento de conceito. Define os princípios, o formato e os limites do sistema. O modelo de dados concreto vive no schema Prisma (seção 5).
> Para decisões com contexto (o porquê de cada escolha) e como rodar, ver o [README](./README.md).
> Princípios de qualidade de código (KISS, DRY, Clean Code, SOLID, composição sobre herança, Lei de Demeter, padrões GoF) e o pipeline de validação local (husky) são governados pelo [AGENTS.md](./AGENTS.md).

## 1. Visão geral

O Seatly é uma plataforma de eventos e ingressos com três papéis:

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
│                          Seatly (repo)                       │
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
├── pages/       Uma pasta-arquivo por rota (Home, Evento, Checkout, Portaria, ...)
├── components/  Componentes reutilizáveis (SeatMap, TicketCard, QrScanner, ...)
├── contexts/    Estado de sessão/auth e toasts
└── lib/         Cliente HTTP do /api e helpers puros (formatação, ...)
```

Regras:

- **Role-gating no front é só UX.** Esconder/mostrar botões por papel melhora o produto, mas não protege nada: a autorização real é feita pelos guards no backend.
- O client nunca decide preço, disponibilidade ou validade — ele exibe o que o server responde.
- Estado de autenticação em `context`; token em `localStorage`; toda chamada protegida envia `Authorization: Bearer <token>`.

## 4. Server (NestJS) — mapa de módulos

```
                        ┌────────────┐
                        │   Prisma   │  acesso ao Postgres (Supabase)
                        └─────┬──────┘
                              ▲
        ┌────────┬────────┬────┴────┬────────┬──────────┬──────┐
        │        │        │         │        │          │      │
     ┌──┴──┐ ┌──┴──┐ ┌───┴────┐ ┌───┴────┐ ┌┴───┐ ┌────┴───┐ ┌┴────┐
     │Auth │ │Catalog│ │ Events │ │Sessions│ │Seats│ │Reserv. │ │Paym.│
     └──┬──┘ └──┬──┘ └───┬────┘ │ Seats   │ └────┘ └───┬────┘ └──┬──┘
        │       │        │      └────────┘             │         │
        │       │        │                             │         │
        └───┬───┘        │                     ┌───────┴─────────┘
            │            │                     │
        ┌───┴────┐   ┌───┴────┐          ┌─────┴─────┐
        │ Tickets │   │Validation│        │  Stats    │
        └───┬────┘   └─────────┘        └───────────┘
            │
        ┌───┴─────┐
        │Favorites│
        └─────────┘
```

- **auth** — registro com verificação de email, login (passport-local + JWT), estratégias e guards por papel. **Implementado**.
- **catalog** — adapter para o TMDb (`CatalogProvider`): busca e detalhe de filmes, normalizados para um formato próprio; extensível para Ticketmaster. **Implementado** (`TmdbAdapter` com `fetch`, `GET /api/catalog/buscar`).
- **events** — CRUD do organizador: montar evento a partir do catálogo, definir local, categorias de ingresso e preços, publicar/cancelar. **Implementado** — com reservas só edita a descrição e só cancela; sem reservas edita tudo e soft-deleta; `GET :id` devolve métricas.
- **sessions / seats** — um evento tem várias sessões (data/hora). Cada sessão tem seu mapa de assentos, gerado a partir da configuração de fileiras. A unicidade de um lugar por sessão é garantida por constraint de banco. **Sessions implementado** — sessão com reservas não edita `dataHora` e só cancela; assentos ficam para a fatia seguinte.
- **reservations** — hold de assentos com validade (15 min): o cliente seleciona lugares e categorias, vê o subtotal, e os assentos ficam `reservados` até o pagamento ou expiração.
- **payments** — provedor **simulado** com regra determinística: cartão com último dígito ímpar é recusado; Pix sempre aprovado após delay simulado. Nenhuma transação financeira real.
- **tickets** — emissão do ingresso com token assinado (QR não-forjável) e código curto para digitação manual; listagem "Meus ingressos" e link público de compartilhamento.
- **validation** — portaria: valida por QR (token) ou código manual; consumo atômico impede uso duplo; fluxo em 2 fases para meia-entrada/gratuidade.
- **favorites** — eventos salvos pelo cliente.
- **stats** — painel do organizador: ocupação por sessão, ingressos vendidos por categoria e receita.

**Mapeamento para o scaffold atual (`server/src/`, sem lógica de negócio):**

| Módulo | Pasta | Observações |
|---|---|---|
| auth | `auth/` | **implementado** — `auth.service.ts`, `auth.controller.ts`, `strategy/` (JWT + local), `dto/`, `types/` |
| usuario | `usuario/` | **implementado** — `usuario.repository.ts`, `usuario.service.ts`, `usuario.controller.ts`, `dto/` |
| catalog | `catalog/` | **implementado** — `providers/` (`TmdbAdapter` + `CatalogProvider`), `catalog.service.ts`, `catalog.controller.ts`, `dto/` |
| evento | `evento/` | **implementado** — `evento.repository.ts`, `evento.service.ts`, `evento.controller.ts`, `dto/` |
| sessao | `sessao/` | **implementado** — `sessao.repository.ts`, `sessao.service.ts`, `sessao.controller.ts`, `dto/` |
| assento | `assento/` | `assento.repository.ts` |
| reserva | `reserva/` | `reserva.repository.ts` |
| pagamento | `pagamento/` | `pagamento.repository.ts` + `providers/` (gateway mock) |
| ingresso | `ingresso/` | `ingresso.repository.ts` |
| validacao | `validacao/` | reutiliza `IngressoRepository` |
| favorito | `favorito/` | `favorito.repository.ts` |
| stats | `stats/` | reutiliza `EventoRepository`/`SessaoRepository` |
| infra | `common/` | decorators `@Roles`/`@Public`, guards JWT/papéis |
| infra | `prisma/` | `PrismaService`/`PrismaModule` (global) |
| infra | `utils/` | utilitários (HMAC do QR, código curto, OTP, centavos) |

Repositories existem nos **8 módulos com tabelas**; `validacao`/`stats` reutilizam repositórios alheios e `catalog` não toca o banco. **Implementados até aqui: `auth`, `usuario`, `catalog`, `evento` e `sessao`** — sempre no padrão controller → service → repository → `dto/`, com specs Jest por camada.

### Módulo organizador (catalog + evento + sessao)

- **Ownership = 404**: qualquer id de evento/sessão de outro organizador responde `404` (não vaza existência) — mesmo padrão usado no auth.
- **Regras de reserva**: evento/sessão **com qualquer reserva** (qualquer status) só permite cancelar — no evento ainda cabe editar apenas a `descricao`; **sem reservas** edita tudo e permite soft delete (`excluidoEm`, some da plataforma sem apagar a linha). Evento `CANCELADO` não recebe novas sessões e não volta a `PUBLICADO`.
- **Cancelar evento = transação**: sessões `ATIVA` viram `CANCELADA` e o evento vira `CANCELADO` numa única `$transaction`.
- **Métricas em `GET /api/eventos/:id`** (dono): `reservasTotais`, `reservasPorSessao`, `valorArrecadado` (= `Σ subtotalCentavos` de reservas `PAGO`), `valorArrecadadoPorSessao`, `ingressosPorCategoria` e `ingressosPorCategoriaPorSessao` — computadas em TS no `EventoService` a partir de um `findMany` enxuto de reservas (KISS, sem SQL raw).
- **Snapshot do TMDb**: com `tmdbId`, título/sinopse/pôster vêm do catálogo e podem ser sobrescritos pelo organizador; o evento sobrevive se a API externa cair.
- **Papel dinâmico**: o registro aceita `papel: 'CLIENT' | 'ORGANIZER'` — o papel é buscado/criado sob demanda na mesma transação do usuário.

### Autenticação e papéis

- JWT assinado pelo servidor com payload `{ sub, email, roles[] }` — papéis: `ORGANIZER`, `CLIENT`, `VENUE` (portaria). Expiram em 7 dias.
- **Guards globais** (`APP_GUARD`): `JwtAuthGuard` exige token por padrão e respeita `@Public`; `RolesGuard` + decorator `@Roles(...)` restringem rotas por papel (ex.: criar evento exige `ORGANIZER`; validar ingresso exige `VENUE`; reservar exige `CLIENT`).
- **Registro cria o papel `CLIENT` sob demanda** (`Papeis` vazia) na mesma `$transaction` do usuário; senha com `bcrypt` (custo 10).
- Verificação de email por **OTP de 6 dígitos (TTL 10 min)**. Em dev (`ALLOW_OTP_FALLBACK`), o código `000000` sempre funciona e o código "enviado" é devolvido na resposta — simulando o email sem infraestrutura real.
- **Login exige email verificado e conta ativa**; usuário desativado (coluna `ativo`) não autentica.

## 5. Modelo de dados (Prisma)

> Fonte da verdade: `server/prisma/schema.prisma` (migração inicial versionada em `server/prisma/migrations/`). Tabelas em snake_case, enums nativos no banco.

**Tabelas (13):**

| Grupo | Tabelas | Papel |
|---|---|---|
| Identidade | `Usuarios`, `Papeis`, `Papeis_Usuario` | conta com papéis N:N (Organizador/Cliente/Portaria); `verificado` + campos de OTP + `ativo` (desativação de conta) |
| Catálogo do organizador | `Eventos`, `Enderecos_Eventos`, `Categorias_Evento` | evento snapshotado do TMDb; endereço 1:1; catálogo de preços por categoria (INTEIRA/MEIA/GRATUIDADE) |
| Sessão e assentos | `Sessao_Eventos`, `Assentos_Sessao` | sessões múltiplas por evento; mapa de assentos com estado por sessão |
| Venda | `Reservas`, `Reservas_Itens`, `Pagamentos` | hold de 15 min; um item por assento com preço congelado; pagamento mock determinístico |
| Pós-venda | `Ingressos`, `Favoritos` | ingresso com código curto + token do QR; favoritos por cliente |

**Constraints que sustentam a integridade:**

- `UNIQUE(sessao_id, fileira, numero)` — um lugar existe uma única vez por sessão; dupla-venda é impossível por constraint, não por lógica de aplicação.
- `UNIQUE(assento_sessao_id)` em `Reservas_Itens` e `Ingressos` — um assento não entra em duas reservas nem vira dois ingressos.
- `UNIQUE(email)`, `UNIQUE(Papeis_Usuario.usuario_id, papel_id)`, `UNIQUE(Ingressos.codigo)`, `UNIQUE(Favoritos.usuario_id, evento_id)` e `UNIQUE(Categorias_Evento.evento_id, nome)` (uma categoria de cada por evento).
- `categoria`/`preco_centavos` são **denormalizados** em itens e ingressos: congelam o valor na compra e evitam join na validação da portaria.

**Enums:** `EventoStatus`, `CategoriaIngresso`, `AssentoStatus`, `ReservaStatus`, `IngressoStatus`, `ComprovanteStatus`, `PagamentoTipo`, `PagamentoStatus`.

**Notas de desenho:**

- `PagamentoStatus` só tem `APROVADO`/`RECUSADO`: o pagamento é síncrono e determinístico no mock — não existe estado intermediário de processamento.
- `ComprovanteStatus` materializa o fluxo de 2 fases da portaria (`PENDENTE` → `CONFIRMADO`/`RECUSADO`).
- A migração inicial foi gerada com `prisma migrate diff` e está versionada; a aplicação ao banco fica pendente da `DATABASE_URL` real.
- `20260815000001_usuario_ativo` adiciona `Usuarios.ativo` (`Boolean @default(true)`) — aplicada manualmente no dashboard do Supabase e registrada com `prisma migrate resolve`.
- `20260815000002_organizador_fluxo` adiciona `Eventos.excluido_em` e `Sessao_Eventos.{status, excluido_em}` (enum `SessaoStatus`) — SQL escrito manualmente (o `prisma migrate diff` falha contra o pooler com bug de prepared statement); **aguardando aplicação no dashboard + `migrate resolve`**.

## 6. Segurança do ingresso

```
                        ┌─────────────────────────────┐
   QR gerado com ──────▶│  token = payload + HMAC     │
   segredo do servidor  │  (assinado; cliente não     │
                        │   consegue forjar)          │
                        └─────────────┬───────────────┘
                                      │
      Validação na portaria ──────────┤
      (token via câmera, ou           │
       código curto digitado)         │
                                      ▼
                    ┌────────────────────────────────┐
                    │  consumo ATÔMICO              │
                    │  "marca como usado SÓ se ainda │
                    │   estiver válido"             │
                    │  → segundo scan = JÁ_UTILIZADO │
                    └────────────────────────────────┘
```

- O QR codifica um **token assinado por HMAC** com segredo do servidor — impossível de forjar sem o segredo. O token não contém dados sensíveis além de referências.
- Ao lado do QR existe um **código curto** para digitação manual na portaria (alternativa exigida pelo enunciado à leitura por câmera).
- A validação consome o ingresso com **operação atômica**: atualiza o estado "só se ainda não usado". Dois dispositivos validando o mesmo ingresso: só o primeiro vence.
- A venda dupla de um mesmo lugar é impedida por **constraint de unicidade no banco**, no nível mais forte possível — não por lógica de aplicação.

### Validação em 2 fases (meia-entrada / gratuidade)

```
        scan do QR
             │
             ▼
     ingresso pede comprovante?  ──não──▶  VÁLIDO  (consome agora)
             │sim
             ▼
     PROOF_REQUIRED (não consome)
             │
      portaria examina o comprovante
             │
        ┌────┴─────┐
        │          │
   Confirmado    Recusado
        │          │
        ▼          ▼
    VÁLIDO      não consome;
  (consome)    registra tentativa
```

- Ingressos `INTEIRA` são validados de uma vez.
- Ingressos `MEIA`/`GRATUIDADE`: o scan sinaliza `PROOF_REQUIRED` e **não** consome o ingresso; a portaria confere o comprovante e decide **Confirmado** (consome atomicamente) ou **Recusado** (não consome, fica registrado para auditoria).

## 7. Fluxos que moldam a arquitetura

### Reserva → pagamento → ingresso

```
  cliente escolhe sessão
        │
        ▼
  seleciona assentos (categoria por lugar) ──▶ subtotal no cliente
        │
        ▼
  reserva com hold de 15 min (assentos reservados)
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

### Portaria

```
  portaria seleciona evento + sessão
        │
        ├──▶ câmera lê o QR ──► token
        │          ou
        └──▶ código digitado manualmente
                 │
                 ▼
          server valida (assinatura + sessão + estado)
                 │
                 ▼
   VÁLIDO · INVÁLIDO · JÁ_UTILIZADO · EVENTO_ERRADO · SESSÃO_ERRADA · PROOF_REQUIRED
                 │
                 ▼
        feedback visual na tela (verde/vermelho)
```

### Compartilhamento

```
  cliente toca "compartilhar"
        │
        ▼
  link público /ingressos/compartilhado/:token
        │
        ▼
  qualquer pessoa vê o ingresso + QR (sem dados de conta)
```

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

## 9. Fora do escopo (deliberado)

| Item | Por quê |
|---|---|
| Código de empresa / multi-tenancy | Papel do usuário é suficiente; contexto de empresa não adiciona valor ao escopo do desafio |
| Email real (verificação/reset) | Substituído por OTP simulado com fallback dev — demonstra o fluxo sem infra |
| Provedor de pagamento real | Substituído por mock determinístico |
| Assentos em tempo real (websockets) | A consulta a cada interação já é suficiente; reserva com hold evita corrida |
| Docker / orquestração | Deploy simples é o suficiente |
| Nota fiscal, revenda, app nativo | Fora do enunciado |
| Banco não-relacional ou cache distribuído | Sem caso de uso que justifique |

## 10. Ligações

- **Decisões com contexto e linha do tempo** → [README](./README.md)
- **Modelo de dados e migração** → `server/prisma/schema.prisma` + `server/prisma/migrations/`
