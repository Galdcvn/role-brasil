# Rolê Brasil — Design System & Especificações Técnicas UI/UX

> Documento de design. Define os tokens visuais, componentes e fluxos de interface para as três frentes da plataforma.
> Stack: React 19 + Vite 8 + Tailwind CSS 4 + React Router 7.

---

## 1. Global Design Tokens (Tailwind Config)

A consistência da marca "Rolê Brasil" é mantida através de tokens globais que adaptam sua aplicação de acordo com o contexto (B2C vs B2B).

### 1.1 Cores (Paleta Principal)

| Token | Hex | Uso |
|-------|-----|-----|
| **Brand Primary (Verde Elétrico)** | `#00FF88` | CTAs principais (Comprar Ingresso, Validação de Sucesso) |
| **Brand Dark (Fundo B2C)** | `#0B0F17` | Base para Dark Mode do cliente |
| **Brand Light (Fundo B2B)** | `#F8FAFC` | Base para Dashboard do Organizador |
| **Semantic Success** | `#22C55E` | Pagamento aprovado, ingresso "Válido" na portaria |
| **Semantic Error** | `#EF4444` | Erros, assentos ocupados, pagamento recusado, ingresso "Inválido" |
| **Semantic Warning** | `#F59E0B` | Ingresso "Já utilizado" ou "Evento errado" |
| **Secondary Gray** | `#94A3B8` | Textos secundários, bordas de formulários |
| **Text Dark** | `#0F172A` | Títulos principais e textos de leitura |
| **Background Light** | `#F8FAFC` | Fundo principal (B2B) |

### 1.2 Tipografia

| Contexto | Fonte | Pesos | Uso |
|----------|-------|-------|-----|
| **Headings (Títulos/Destaques)** | `Space Grotesk` ou `Syne` | 700, 800 | Energia "urbana e festiva" — títulos de eventos, banners |
| **Body (Textos/Interface)** | `Inter` | 400, 500, 600 | Alta legibilidade — dados, painéis, ingressos, formulários |

### 1.3 Espaçamento e Bordas

| Token | Valor | Uso |
|-------|-------|-----|
| Border radius (cards) | `rounded-xl` (12px) | Cards de evento, KPI cards |
| Border radius (botões) | `rounded-lg` (8px) | Botões de ação |
| Border radius (pills) | `rounded-full` | Filtros de categoria, badges |
| Espaçamento base | `gap-4` / `p-6` | Grids, seções |

---

## 2. Customer Facing (B2C — Vitrine e Compras)

**Objetivo UI/UX:** Imersão, descoberta de eventos e checkout sem fricção.
**Tema Principal:** Dark Mode nativo para destacar o brilho das imagens dos eventos e a cor verde neon da marca.

### 2.1 Estrutura de Layout

- **Header:** Transparente com blur (`backdrop-blur-md`), logotipo à esquerda, barra de busca centralizada e avatar do usuário/menu à direita.
- **Hero Section:** Destaque carrossel ou banner estático de eventos patrocinados. Título forte: *"Seu próximo Rolê começa aqui."*
- **Filtros (Pills):** Botões arredondados (`rounded-full`) com ícones para categorias (Shows, Festivais, Teatro).
- **Grid de Eventos:** Grid responsivo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).

### 2.2 Componentes

#### `<EventCard />`
- Imagem de capa com `aspect-video` e `object-cover`.
- Efeito hover: `hover:scale-[1.02] transition-transform duration-300`.
- Badge flutuante absoluto sobre a imagem para categoria (ex: "FESTIVAL").
- Botão primário no rodapé: `w-full bg-[#00FF88] text-black font-bold rounded-lg py-2`.

#### `<TicketQR />`
- Simula fisicamente um ingresso. Bordas perfuradas (`border-dashed border-2`) ou recortes laterais (pseudo-elementos ou máscaras SVG).
- Fundo branco (`bg-white`) mesmo no Dark Mode para contraste máximo com o QR Code.
- Conteúdo: título do evento, Data/Hora, Local, Setor/Assento.
- QR Code grande e escaneável + código alfanumérico como fallback.
- Botão "Compartilhar Link" (copia URL ou usa Web Share API).

### 2.3 Seletores de Capacidade

#### Mapa de Assentos (Grid)
- Matriz visual onde assentos têm estados: *Livre (Gray), Selecionado (#00FF88), Ocupado (Error)*.
- Em mobile: container com `overflow: auto` (ou `touch-action: pan-x pan-y`) para rolar sem quebrar o layout.

#### Stepper de Pista (+ / -)
- Para eventos sem lugar marcado. Botão `-`, número de ingressos, botão `+`.
- Desativa `+` ao atingir capacidade máxima.

### 2.4 Boas Práticas B2C

- **Estado do carrinho:** Context API para manter estado durante Reserva → Checkout → Sucesso (evita perda no refresh).
- **Feedback de pagamento:** `setTimeout` de ~2 segundos com spinner no botão para simular gateway bancário.
- **Compartilhamento:** Copiar link único (ex: `role-brasil.com/ticket/A1B2C3D4`) ou Web Share API nativa (WhatsApp, Email).

---

## 3. Organizer Dashboard (B2B — Gestão de Eventos)

**Objetivo UI/UX:** Clareza, gestão de dados densos e análise de performance.
**Tema Principal:** Light Mode / High-Contrast. Reduz fadiga visual durante uso prolongado.

### 3.1 Estrutura de Layout

- **Sidebar:** Navegação lateral fixa (`w-64 bg-white border-r border-slate-200`). Links para Visão Geral, Ingressos, Relatórios, Check-in, etc.
- **Top Bar:** Breadcrumbs do evento atual, seletor de eventos rápido e menu de configurações do gestor.
- **Main Content Area:** Fundo cinza claro (`bg-slate-50`).

### 3.2 Componentes

#### `<KpiCard />`
- Grid superior com métricas: "Vendas do Dia", "Ingressos Vendidos", "Pessoas no Local".
- Estilo: `bg-white rounded-xl shadow-sm border border-slate-100 p-6`.
- Rótulos: `text-slate-500 text-sm font-medium`. Valores: `text-slate-900 text-3xl font-bold`.

#### `<SalesChart />`
- Gráficos de vendas ao longo do tempo (Recharts ou Chart.js — **requer autorização** para instalar).
- Preenchimento da área: gradiente suave do verde primário (`#00FF88` → transparente).

#### Tabelas de Lotes / Lista de Presença
- Paginação ou virtualização (`@tanstack/react-virtual` — **requer autorização**) para listas grandes.
- Colunas de status com badges semânticos (Verde = Validado, Cinza = Pendente).

### 3.3 Buscador de Catálogo (Typeahead / Autocomplete)

- **Uso:** Organizador busca shows/filmes da API externa.
- **Comportamento:** Input que, após 3 caracteres, exibe dropdown com resultados da API (capa miniatura + título). Ao clicar, autopreenche dados do evento.

---

## 4. Validator PWA (Portaria — App de Escaneamento)

**Objetivo UI/UX:** Velocidade extrema, feedback à prova de erros, uso em condições adversas (sol forte ou escuro de balada).
**Tema Principal:** Dark Mode Extremo com feedbacks em Full Screen.

### 4.1 Estrutura de Layout (Mobile First)

- **Viewport Principal:** Feed da câmera ocupa quase toda a tela, com "mira" (overlay guide) centralizada sinalizando onde posicionar o QR Code.
- **Top Bar Simples:** Nome do evento logado e contador de check-ins (ex: "350/500").
- **Botões Auxiliares:** Botões grandes (`min-h-[60px]`) para ligar lanterna (Flashlight API) ou alternar câmera.
- **Modo Alternativo:** Campo de texto + botão "Digitar código manualmente" (fallback se câmera quebrar ou tela do cliente estiver trincada).

### 4.2 Componentes

#### `<Scanner />`
- Utilizar `html5-qrcode` para decodificação de QR via câmera (**requer autorização** para instalar).
- Ao detectar um código, **pausar o feed de vídeo imediatamente** para evitar leituras duplicadas.

#### `<SuccessOverlay />`
- Fundo verde vibrante (`bg-[#00FF88]`), ícone de Check gigante, texto "VALIDADE CONFIRMADA".
- Cobertura de ~80% da tela por 2 segundos.
- Efeito sonoro agudo (beep duplo).

#### `<ErrorOverlay />`
- Fundo vermelho intenso (`bg-red-500`), ícone de X gigante.
- Texto: "INGRESSO INVÁLIDO" ou "JÁ UTILIZADO (às 22:45)".
- Cobertura de ~80% da tela por 2 segundos.
- Haptic feedback: `navigator.vibrate([200, 100, 200])` para alertar o segurança instantaneamente.

#### `<PendingDocsOverlay />`
- Fundo amarelo/laranja (`bg-[#F59E0B]`), ícone de alerta.
- Texto: "NECESSÁRIA VERIFICAÇÃO DE DOCUMENTAÇÃO".
- Exibe dados do ingresso (nome, categoria) e botões de confirmar/rejeitar.

### 4.3 Boas Práticas Portaria

- **Permissão de câmera:** Pedir de forma amigável: *"O Rolê Brasil Validador precisa acessar sua câmera para ler os QRs"*.
- **Touch targets:** Qualquer botão deve ter no mínimo `min-h-[60px]` para clique rápido.
- **Escuro de balada:** Tema extremamente escuro para economizar bateria e não ofuscar o operador.

---

## 5. Navegação e Rotas

| Rota | Acesso | Tema |
|------|--------|------|
| `/` | Público / Cliente | Dark (B2C) |
| `/evento/:id` | Público / Cliente | Dark (B2C) |
| `/checkout/:id` | Cliente logado | Dark (B2C) |
| `/meus-ingressos` | Cliente logado | Dark (B2C) |
| `/admin/dashboard` | Organizador | Light (B2B) |
| `/admin/evento/novo` | Organizador | Light (B2B) |
| `/validador` | Portaria | Dark Extremo |

---

## 6. Boas Práticas Técnicas (React + Vite + Tailwind)

- **Gerenciamento de Estado:** Context API para carrinho (Reserva → Checkout → Sucesso), auth context para JWT.
- **Token em `localStorage`**, toda chamada protegida envia `Authorization: Bearer <token>`.
- **Role-gating no front é só UX** — esconder/mostrar botões por papel; autorização real é server-side.
- **Responsividade:** Mapa de assentos em mobile deve usar `overflow: auto` dentro de container com dimensões fixas.
- **Feedback de Pagamento:** Simular delay de 2s com spinner para realismo.
- **Responsividade do Grid:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` para cards de eventos.
