# Rolê Brasil — Design System

> Documento de design. Define os tokens visuais, componentes e fluxos de interface para as três frentes da plataforma.
> Stack: React 19 + Vite 8 + Tailwind CSS 4 + React Router 7.

---

## 1. Design Tokens

### 1.1 Cores

| Token | Valor | Uso |
|-------|-------|-----|
| **Primary** | `#00FF88` (verde elétrico) | CTAs principais, links de ação, status de sucesso |
| **Background** | `slate-950` (`#020617`) | Fundo único para toda a plataforma |
| **Surface** | `slate-900` / `slate-800` | Cards, formulários, modais |
| **Border** | `slate-700` | Bordas sutis em cards e inputs |
| **Text Primary** | `white` | Títulos e textos principais |
| **Text Secondary** | `slate-300` / `slate-400` | Textos auxiliares, labels |
| **Success** | `#00FF88` | Aprovação, ingresso válido |
| **Error** | `red-500` | Erros, pagamento recusado, ingresso inválido |
| **Warning** | `amber-500` | Pendente de documentação, atenção |

### 1.2 Tipografia

| Contexto | Fonte | Pesos | Uso |
|----------|-------|-------|-----|
| **Headings (h1/h2/h3)** | Space Grotesk | 700, 800 | Títulos de página, cards, banners |
| **Body** | Inter | 400, 500, 600 | Textos, formulários, dados, badges |

Fontes carregadas via Google Fonts em `client/index.html`.

### 1.3 Espaçamento e Bordas

| Token | Valor | Uso |
|-------|-------|-----|
| Border radius (cards) | `rounded-xl` (12px) | Cards de evento, KPI cards |
| Border radius (botões) | `rounded-lg` (8px) | Botões de ação |
| Border radius (pills) | `rounded-full` | Filtros de categoria, badges |
| Espaçamento base | `gap-4` / `p-6` | Grids, seções |

---

## 2. Tema

**Tema escuro único.** Não há toggle light/dark e não há diferença de tema entre papéis. Todo o conteúdo usa fundo `slate-950` com superfícies em `slate-900`/`slate-800`.

---

## 3. Componentes Compartilhados (`client/src/components/ui/`)

### `<Button>`
- Variantes: `primary` (verde), `danger` (vermelho), `secondary` (slate)
- Loading state: spinner + `<span className="sr-only">Carregando...</span>` para acessibilidade
- Tamanhos: `sm`, `md`, `lg`
- Mobile: `min-h-[44px]` para touch targets adequados

### `<Input>`
- Ícone opcional (prop `icon` — `ReactNode`)
- Mensagens de erro (`error` prop)
- Variante dark (fundo `slate-900`, borda `slate-700`, foco `#00FF88`)

### `<StatusBadge>`
- Cores automáticas por status usando mapa:
  - `PUBLICADO`, `EMITIDO`, `APROVADO`, `ATIVA`, `CONFIRMADO` → verde
  - `PENDENTE_DOCUMENTACAO` → amber
  - `CANCELADO`, `REJEITADO`, `RECUSADO`, `CANCELADA` → vermelho
  - `RASCUNHO`, `PENDENTE` → cinza
  - `USADO` → amber (visual distinct do pendente)
- Labels human-readable (ex.: "Pendente Doc." em vez de "PENDENTE_DOCUMENTACAO")

### `<EmptyState>`
- Ícone semântico (📋), título, mensagem, botão de retry opcional

### `<ConfirmDialog>`
- Modal de confirmação reutilizável
- Variantes: `perigo` (botão vermelho) e `padrão` (botão verde)
- Loading state no botão de confirmação

### `<Card>`, `<Modal>`, `<Select>`, `<TextArea>`
- Primitivos de layout com estilo dark consistente

### `<QRScanner>`
- Componente fullscreen que usa `html5-qrcode` para ler QR pela câmera
- Mensagem amigável quando a câmera falha + auto-close após 2s
- Callback `onScan(decodedText)` ao detectar

---

## 4. Hooks Compartilhados (`client/src/hooks/`)

| Hook | Propósito |
|------|-----------|
| `useDocumentTitle` | Define `document.title` por página com cleanup automático |
| `useBeforeUnload` | Avisa antes de sair com mudanças não salvas |

---

## 5. Utility

`formatarCentavos` em `client/src/utils/formatarCentavos.ts` — formata centavos como `R$ XX,XX` sem separador de milhar.

---

## 6. Layout e Navegação

### Portal Unificado

Um único shell (sidebar + header) serve todos os papéis. O papel ativo é controlado por `PortalContext`.

### Rotas

| Rota | Acesso |
|------|--------|
| `/` | Público |
| `/login` | Público |
| `/cadastro` | Público |
| `/ingressos/compartilhar/:codigo` | Público (link de compartilhamento) |
| `/portal` | Redirect para papel ativo |
| `/portal/cliente` | CLIENT |
| `/portal/cliente/evento/:id` | CLIENT |
| `/portal/cliente/ingressos` | CLIENT |
| `/portal/cliente/ingressos/:id` | CLIENT |
| `/portal/cliente/favoritos` | CLIENT |
| `/portal/organizador` | ORGANIZER |
| `/portal/organizador/eventos` | ORGANIZER |
| `/portal/organizador/eventos/novo` | ORGANIZER |
| `/portal/organizador/eventos/:id` | ORGANIZER |
| `/portal/organizador/eventos/:id/editar` | ORGANIZER |
| `/portal/organizador/relatorios` | ORGANIZER |
| `/portal/portaria` | PORTARIA |
| `/portal/portaria/historico` | PORTARIA |

### Sidebar (desktop)
- Fixa à esquerda em `≥ lg` (`w-64`)
- Links com ícone + texto, active state com `#00FF88`
- Logo RB no topo

### Sidebar (mobile)
- Slide-over com backdrop escuro
- Abre via botão hamburger no Header
- Fecha ao clicar fora ou navegar

### Header
- Fundo `slate-950/80 backdrop-blur`
- Título da página à esquerda
- Botões de ação à direita (logout, etc.)
- Portaria: botão fullscreen/kiosk

---

## 7. Páginas por Portal

### Cliente

- **InicioPage**: busca de eventos públicos com filtros (texto, cidade, estado) e paginação. Cards com poster placeholder, endereço, categorias, próxima sessão.
- **DetalheEventoPage**: state machine de compra — INFO → ASSENTOS → RESERVA → CONFIRMAÇÃO. Mapa de assentos estilo teatro, categorias dinâmicas, timer 10 min, pagamento (PIX/cartão), chat integrado.
- **IngressosPage**: lista de ingressos com filtros por status.
- **DetalheIngressoPage**: QR code, código de 16 chars, cancelamento com confirmação.
- **FavoritosPage**: grid de eventos favoritados com retry.

### Organizador

- **DashboardPage**: KPI cards (eventos, reservas, receita), eventos por status.
- **EventosPage**: listagem com busca, filtro por status, poster placeholder, sessões pluralizadas.
- **DetalheEventoPage**: métricas, categorias, sessões, ações com ConfirmDialog (Publicar/Cancelar/Excluir/Cancelar Sessão).
- **NovoEventoPage**: form multi-step com busca TMDb, validações, beforeunload.
- **EditarEventoPage**: form com proteção (se tem reservas, só edita descrição), beforeunload.
- **RelatoriosPage**: métricas por evento (reservas por sessão com data/hora, ingressos por categoria).

### Portaria

- **ValidarPage**: input com aria-label + botão "Escanear QR Code". Evento (recomendado) dropdown. Resultado com Card colorido + StatusBadge. Confirmar/Rejeitar com ConfirmDialog para rejeição. Loading states separados.
- **HistoricoPage**: busca por código + filtro por status + data/hora + observação + retry.

---

## 8. Heurísticas de Nielsen Aplicadas

| Heurística | Implementação |
|---|---|
| Visibilidade do status | `StatusBadge` com labels human-readable |
| Correspondência com o mundo real | Mensagens de erro amigáveis (não HTTP codes) |
| Controle e liberdade do usuário | Botão Voltar, beforeunload, ConfirmDialog |
| Consistência e padronização | Componentes compartilhados (Button, Input, Card, etc.) |
| Prevenção de erros | Validação de data futura, sessões para publicar, limite 10 assentos |
| Reconhecimento em vez de memória | Filtros e busca em todas as listas |
| Flexibilidade e eficiência | Search + filter dropdowns em Eventos e Histórico |
| Design minimalista | EmptyState semântico, apenas informação necessária |
| Ajuda e documentação | Requisitos de senha visíveis, hint de CVV |
| Tratamento de erros | Mensagens em cards coloridos, retry buttons |
