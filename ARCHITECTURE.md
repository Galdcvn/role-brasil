# Seatly — Arquitetura

> Documento de conceito. Define os princípios, o formato e os limites do sistema **antes** do modelo de dados — que será desenhado à parte.
> Para decisões com contexto (o porquê de cada escolha) e como rodar, ver o [README](./README.md).

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

- **auth** — registro com verificação de email, login, verificação e reset de senha (OTP), estratégia JWT e guards por papel.
- **catalog** — adapter para o TMDb (`CatalogProvider`): busca e detalhe de filmes, normalizados para um formato próprio; extensível para Ticketmaster.
- **events** — CRUD do organizador: montar evento a partir do catálogo, definir local, categorias de ingresso e preços, publicar/cancelar.
- **sessions / seats** — um evento tem várias sessões (data/hora). Cada sessão tem seu mapa de assentos, gerado a partir da configuração de fileiras. A unicidade de um lugar por sessão é garantida por constraint de banco.
- **reservations** — hold de assentos com validade (15 min): o cliente seleciona lugares e categorias, vê o subtotal, e os assentos ficam `reservados` até o pagamento ou expiração.
- **payments** — provedor **simulado** com regra determinística: cartão com último dígito ímpar é recusado; Pix sempre aprovado após delay simulado. Nenhuma transação financeira real.
- **tickets** — emissão do ingresso com token assinado (QR não-forjável) e código curto para digitação manual; listagem "Meus ingressos" e link público de compartilhamento.
- **validation** — portaria: valida por QR (token) ou código manual; consumo atômico impede uso duplo; fluxo em 2 fases para meia-entrada/gratuidade.
- **favorites** — eventos salvos pelo cliente.
- **stats** — painel do organizador: ocupação por sessão, ingressos vendidos por categoria e receita.

### Autenticação e papéis

- JWT assinado pelo servidor com `role` no payload: `ORGANIZER`, `CLIENT`, `VENUE` (portaria).
- `RolesGuard` + decorator `@Roles(...)` restringem cada rota. Ex.: criar evento exige `ORGANIZER`; validar ingresso exige `VENUE`; reservar exige `CLIENT`.
- Verificação de email e reset de senha usam **OTP de 6 dígitos**. Em dev (`ALLOW_OTP_FALLBACK`), o código `000000` sempre funciona e o código "enviado" é devolvido na resposta — simulando o email sem infraestrutura real.
- Login exige email verificado.

## 5. Segurança do ingresso

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

## 6. Fluxos que moldam a arquitetura

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

## 7. Catálogo externo

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

## 8. Fora do escopo (deliberado)

| Item | Por quê |
|---|---|
| Código de empresa / multi-tenancy | Papel do usuário é suficiente; contexto de empresa não adiciona valor ao escopo do desafio |
| Email real (verificação/reset) | Substituído por OTP simulado com fallback dev — demonstra o fluxo sem infra |
| Provedor de pagamento real | Substituído por mock determinístico |
| Assentos em tempo real (websockets) | A consulta a cada interação já é suficiente; reserva com hold evita corrida |
| Docker / orquestração | Deploy simples é o suficiente |
| Nota fiscal, revenda, app nativo | Fora do enunciado |
| Banco não-relacional ou cache distribuído | Sem caso de uso que justifique |

## 9. Ligações

- **Decisões com contexto e linha do tempo** → [README](./README.md)
- **Modelo de dados** → desenhado à parte (este documento não define schema).
