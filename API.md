# Rolê Brasil — Referência da API

> Base URL: `https://role-brasil-production.up.railway.app/api` (produção) ou `http://localhost:3000/api` (desenvolvimento).
> Todas as rotas retornam JSON. Prefixo global `/api` definido no `main.ts`.

---

## Convencões

- **Autenticação**: rotas protegidas exigem header `Authorization: Bearer <token>`.
- **`@Public()`**: rotas marcadas com este decorator não exigem token.
- **`@Roles('X')`**: rotas que exigem o papel específico (`ORGANIZER`, `CLIENT`, `PORTARIA`).
- **Erros**: respostas de erro seguem o formato `{ message: string, error: string, statusCode: number }`.
- **Ownership**: endpoints de organizador/portaria retornam `404` para recursos de outro usuário (não vaza existência).

---

## Auth (4 endpoints — todos públicos)

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| POST | `/auth/registro` | `{ nome, email, senha, papel? }` | Registra novo usuário. Se email existe e papel não vinculado, adiciona papel. |
| POST | `/auth/verificar-email` | `{ email, codigo }` | Verifica OTP de 6 dígitos (TTL 10 min). Dev: `000000` sempre funciona. |
| POST | `/auth/reenviar-codigo` | `{ email }` | Gera novo OTP para usuários não verificados. |
| POST | `/auth/login` | `{ email, senha }` | Retorna `{ access_token, user }`. Exige email verificado e conta ativa. |

---

## Usuário (3 endpoints — JWT)

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| GET | `/usuario/me` | — | Dados do usuário logado. |
| PATCH | `/usuario/me` | `{ nome?, email? }` | Atualiza perfil. |
| PATCH | `/usuario/me/desativar` | — | Desativa conta (`ativo = false`). |

---

## Catálogo (1 endpoint — ORGANIZER)

| Método | Rota | Query | Descrição |
|--------|------|-------|-----------|
| GET | `/catalog/buscar` | `q` | Busca filmes no TMDb. Retorna lista normalizada de resultados. |

---

## Eventos — Organizador (7 endpoints — ORGANIZER)

| Método | Rota | Body/Params | Descrição |
|--------|------|-------------|-----------|
| POST | `/eventos` | `{ tmdbId?, titulo?, descricao?, posterUrl?, telefoneSuporte?, emailSuporte?, endereco?, categorias[] }` | Cria evento. Se `tmdbId` fornecido, snapshota dados do TMDb. |
| GET | `/eventos` | — | Lista eventos do organizador logado. |
| GET | `/eventos/:id` | — | Detalhe do evento com métricas (reservas, receita, ingressos por categoria). |
| PATCH | `/eventos/:id` | `{ titulo?, descricao?, ... }` | Atualiza evento. Se tem reservas, só edita descrição. |
| DELETE | `/eventos/:id` | — | Soft delete (`excluidoEm`). Só sem reservas. |
| POST | `/eventos/:id/publicar` | — | Publica evento (RASCUNHO → PUBLICADO). Exige pelo menos 1 sessão. |
| POST | `/eventos/:id/cancelar` | — | Cancela evento + sessões ATIVA numa `$transaction`. |

---

## Eventos — Público (2 endpoints — públicos)

| Método | Rota | Query/Params | Descrição |
|--------|------|-------------|-----------|
| GET | `/eventos/publicos` | `busca?, dataInicio?, dataFim?, cidade?, estado?, precoMin?, precoMax?, page?, limit?` | Busca pública de eventos com filtros e paginação. |
| GET | `/eventos/publicos/:id` | — | Detalhe público de evento (sem métricas de organizador). |

---

## Sessões (5 endpoints — ORGANIZER)

| Método | Rota | Body/Params | Descrição |
|--------|------|-------------|-----------|
| POST | `/eventos/:eventoId/sessoes` | `{ dataHora, fileiras, assentosPorFileira }` | Cria sessão. Auto-gera mapa de assentos via `$transaction`. |
| GET | `/eventos/:eventoId/sessoes` | — | Lista sessões do evento. |
| PATCH | `/sessoes/:id` | `{ dataHora }` | Atualiza sessão. |
| DELETE | `/sessoes/:id` | — | Remove sessão. |
| POST | `/sessoes/:id/cancelar` | — | Cancela sessão (ATIVA → CANCELADA). |

---

## Assentos (1 endpoint — JWT)

| Método | Rota | Params | Descrição |
|--------|------|--------|-----------|
| GET | `/sessoes/:sessaoId/assentos` | sessaoId | Mapa de assentos da sessão (fileira, número, status). |

---

## Reservas (2 endpoints — JWT)

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| POST | `/reservas` | `{ sessaoId, itens: [{ assentoSessaoId, categoria }] }` | Cria reserva com hold de 10 min. Máx 10 itens. Usa `$transaction` com lock de assentos. |
| GET | `/reservas` | — | Lista reservas do cliente logado. |

---

## Pagamentos (1 endpoint — JWT)

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| POST | `/pagamentos` | `{ reservaId, tipo: 'PIX' \| 'CARTAO', cartao?: { nome, numero, validade, cvv } }` | Processa pagamento mock. PIX sempre aprova. Cartão CVV `000` recusa. Transação atômica. |

---

## Ingressos (4 endpoints — JWT + 1 público)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/ingressos` | JWT | Lista ingressos do cliente. |
| GET | `/ingressos/:id` | JWT | Detalhe do ingresso com QR code (data URL) e código de 16 chars. |
| POST | `/ingressos/:id/cancelar` | JWT | Cancela ingresso (até 7 dias antes do evento). Estorno simulado. |
| GET | `/ingressos/publico/:codigo` | Público | Compartilhamento — detalhe público do ingresso por código. |

---

## Favoritos (3 endpoints — JWT)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/favoritos/:eventoId` | Toggle (adiciona/remove). |
| GET | `/favoritos` | Lista IDs de eventos favoritados. |
| GET | `/favoritos/eventos` | Lista eventos completos favoritados (com detalhes). |

---

## Mensagens (4 endpoints — JWT)

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| POST | `/eventos/:eventoId/mensagens` | `{ conteudo }` | Envia mensagem no chat do evento. |
| GET | `/eventos/:eventoId/mensagens` | — | Lista mensagens do evento (bidirectional). |
| GET | `/mensagens/nao-lidas` | — | Contagem de mensagens não lidas (global). |
| PATCH | `/mensagens/:id/lida` | — | Marca mensagem como lida. |

---

## Portaria (5 endpoints — PORTARIA)

| Método | Rota | Body/Params | Descrição |
|--------|------|-------------|-----------|
| POST | `/portaria/validar` | `{ codigo, eventoId? }` | Valida ingresso por código (16 chars). Retorna status + detalhes. `eventoId` opcional para validar pertencimento. |
| POST | `/portaria/comprovantes/:id/confirmar` | — | Confirma comprovante de meia-entrada/gratuidade. Consome ingresso atomicamente. |
| POST | `/portaria/comprovantes/:id/rejeitar` | — | Rejeita comprovante. Registra tentativa para auditoria. |
| GET | `/portaria/historico` | — | Histórico de scans do portaria logado. |
| GET | `/portaria/historico/:eventoId` | — | Histórico de scans para evento específico. |

---

## Estatísticas (1 endpoint — ORGANIZER)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/stats/organizador` | Métricas agregadas: eventos por status, reservas totais, receita, últimos eventos. |

---

## Resumo

| Módulo | Endpoints | Auth |
|--------|-----------|------|
| Auth | 4 | Público |
| Usuário | 3 | JWT |
| Catálogo | 1 | ORGANIZER |
| Eventos (organizer) | 7 | ORGANIZER |
| Eventos (público) | 2 | Público |
| Sessões | 5 | ORGANIZER |
| Assentos | 1 | JWT |
| Reservas | 2 | JWT |
| Pagamentos | 1 | JWT |
| Ingressos | 4 | JWT + 1 público |
| Favoritos | 3 | JWT |
| Mensagens | 4 | JWT |
| Portaria | 5 | PORTARIA |
| Estatísticas | 1 | ORGANIZER |
| **Total** | **44** | |
