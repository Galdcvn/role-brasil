# Rolê Brasil - Especificação de UI/UX para Plataforma Completa

## 1. Visão Geral do Produto

O **Rolê Brasil** evoluiu para uma plataforma *End-to-End* (Ponta a Ponta) que atende a três perfis distintos de usuários:
1. **O Cliente (B2C):** Descobre eventos, escolhe lugares/quantidades, realiza o pagamento simulado e gerencia seus ingressos digitais.
2. **O Organizador (B2B):** Cria e gerencia eventos de forma simplificada, importando dados de um catálogo externo (API de Filmes/Shows) e definindo regras de negócio (capacidade, preço, local).
3. **A Portaria (Staff/Validador):** Responsável por operar a interface de controle de acesso na entrada do evento, validando QRs via câmera ou digitação.

---

## 2. Fundamentos Visuais (Design Tokens)

Mantemos a identidade visual estabelecida, mas adicionamos cores semânticas para os fluxos de validação e pagamento.

### 2.1 Paleta de Cores
| Nome | Hexadecimal | Uso Principal |
| :--- | :--- | :--- |
| **Primary Teal** | `#00A8B5` | Ações principais, header, seleção de assentos. |
| **Accent Coral** | `#FF6B6B` | Erros, assentos ocupados, pagamento recusado, ingresso "Inválido". |
| **Success Green** | `#20C997` | Pagamento aprovado, ingresso "Válido" na portaria. |
| **Warning Yellow**| `#F5A623` | Ingresso "Já utilizado" ou "Evento errado" (Portaria). |
| **Secondary Gray**| `#8C92AC` | Textos secundários, bordas de formulários. |
| **Text Dark** | `#2D3436` | Títulos principais e textos de leitura. |
| **Background Light**| `#F8F9FA` | Fundo principal. |

---

## 3. Arquitetura da Informação e Navegação

A aplicação deve ser dividida em rotas protegidas e públicas:

*   **Pública / Cliente Logado:**
    *   `/` (Home - Catálogo de Eventos)
    *   `/evento/:id` (Detalhes)
    *   `/checkout/:id` (Seleção de Assentos/Pista e Pagamento)
    *   `/meus-ingressos` (Lista e QRs)
*   **Área do Organizador:**
    *   `/admin/dashboard` (Lista de eventos criados)
    *   `/admin/evento/novo` (Busca na API e Formulário de Criação)
*   **Área de Portaria:**
    *   `/validador` (Acesso à câmera e input manual)

---

## 4. Componentes de UI Específicos do Projeto

Além de botões e tipografia, este projeto exige componentes funcionais chave:

### 4.1 Buscador de Catálogo (Typeahead / Autocomplete)
*   **Uso:** Para o Organizador buscar shows/filmes da API externa.
*   **Comportamento:** Input de texto que, após 3 caracteres, exibe um *dropdown* com os resultados da API (Capa em miniatura + Título). Ao clicar, autopreenche os dados do evento.

### 4.2 Seletores de Capacidade
*   **Mapa de Assentos (Grid):** Matriz visual onde assentos têm os estados: *Livre (Cinza), Selecionado (Teal), Ocupado (Coral)*.
*   **Stepper de Pista (+ / -):** Para eventos sem lugar marcado. Componente simples com um botão `-`, o número de ingressos, e um botão `+`. Desativa o `+` se atingir a capacidade máxima.

### 4.3 Componente do Ingresso Digital
*   **Visual:** Layout de *Ticket* com bordas perfuradas.
*   **Conteúdo:** Título do evento, Data/Hora, Local, Setor/Assento. No centro, um **QR Code grande e escaneável**.
*   **Ações Inclusas:** Botão "Compartilhar Link" (Copia URL pública do ingresso ou usa a API nativa de Web Share).

---

## 5. UX e Fluxos de Usuário (User Flows)

Abaixo, detalhamos a interação passo a passo para cada requisito do projeto.

### 5.1. Fluxo do Organizador (Criação de Eventos)
1. **Início:** Organizador acessa a aba "Criar Evento".
2. **Integração com API:** Uma barra de busca proeminente: *"Qual show ou filme você vai organizar?"*
    *   *UX:* Enquanto digita, faz *fetch* na API externa. Exibe resultados em lista.
3. **Preenchimento Automático:** Ao selecionar uma opção, a imagem de capa, sinopse e título são preenchidos automaticamente.
4. **Definições Locais:** Organizador preenche os campos manuais obrigatórios:
    *   `Data e Hora` (Datepicker).
    *   `Local` (Texto livre ou Google Places).
    *   `Tipo de Espaço:` Toggle (Radio Button) para escolher entre [ Mapa de Assentos ] ou [ Pista/Quantidade Livre ].
    *   `Capacidade e Preço:` Define total de lugares e o valor (R$).
5. **Conclusão:** Botão "Publicar Evento". O evento agora aparece na Home Pública.

### 5.2. Fluxo do Cliente (Navegação, Compra e Pagamento)
1. **Descoberta:** O cliente navega na Home (Pública), vendo os "Eventos em Cartaz". Filtra por data ou nome.
2. **Detalhes do Evento:** Clica no evento, vê as infos importadas da API e as infos definidas pelo organizador. Clica em "Comprar Ingresso".
3. **Reserva (O Sistema avalia o Tipo de Espaço definido pelo organizador):**
    *   *Cenário A (Cinema/Teatro):* Abre o Mapa de Assentos. O usuário clica nas poltronas (ficam Teal). O sistema trava os assentos clicados por outros usuários.
    *   *Cenário B (Pista/Show):* Abre o Seletor de Quantidade. Usuário ajusta o Stepper (+/-) até o limite da capacidade.
4. **Checkout (Pagamento Simulado):**
    *   Resumo do pedido (Subtotal).
    *   Opção de simulação de pagamento: Formulário simples (ex: Nome no cartão, número fictício).
    *   *Cenário de Sucesso:* Sistema valida, gera o ID do ingresso e redireciona para "Sucesso".
    *   *Cenário de Recusa:* Simulamos uma falha (ex: se o usuário digitar o CVV "000"). Exibe Toast/Modal em *Accent Coral*: "Pagamento recusado. Verifique seu limite ou tente outro cartão."

### 5.3. Fluxo Pós-Compra (Meus Ingressos e Compartilhamento)
1. **Acesso:** Cliente vai em "Perfil" > "Meus Ingressos". Lista de eventos futuros e passados.
2. **Visualização:** Ao abrir um ingresso, o QR Code domina a tela. Abaixo dele, o código alfanumérico para caso o QR falhe.
3. **Compartilhamento:** Um botão "Compartilhar Ingresso".
    *   *Web:* Copia um link único (ex: `role-brasil.com/ticket/A1B2C3D4`) para a área de transferência. Ao abrir esse link, a pessoa vê o ingresso digital.
    *   *Mobile:* Abre a gaveta de compartilhamento nativa (WhatsApp, Email, etc).

### 5.4. Fluxo de Portaria (Validação de Entrada)
Esta tela deve ser escura (Dark Mode otimizado) para economizar bateria e não ofuscar o operador em ambientes de show.

1. **Interface Principal:** A tela de Validador exibe o feed da câmera do dispositivo centralizado (usando bibliotecas como `react-qr-reader` ou `html5-qrcode`).
2. **Modo Alternativo:** Abaixo da câmera, um campo de texto e botão: "Digitar código manualmente" (fallback se a câmera quebrar ou a tela do cliente estiver trincada).
3. **Fluxo de Validação:** A câmera lê o QR e faz um POST para a API validar o token.
4. **Feedback de Retorno (Critical UX):** A tela inteira deve piscar/mudar de cor por 2 segundos, acompanhada de um ícone gigante, para o segurança não precisar ler letras miúdas:
    *   🟢 **VÁLIDO:** Fundo *Success Green*. Ícone de Check. Mensagem: "Acesso Liberado - Pista".
    *   🔴 **INVÁLIDO:** Fundo *Accent Coral*. Ícone de 'X'. Mensagem: "Ingresso Não Encontrado/Falso".
    *   🟡 **JÁ UTILIZADO:** Fundo *Warning Yellow*. Ícone de Relógio/Aviso. Mensagem: "Ingresso já bipado às 21:04".
    *   🟠 **EVENTO ERRADO:** Fundo *Warning Yellow* ou *Laranja*. Ícone de Alerta. Mensagem: "Este ingresso é para [Nome de Outro Evento]".

---

## 6. Boas Práticas Técnicas para o Front-End (React / Next.js)

*   **Gerenciamento de Estado:** Use Context API ou Redux para manter o estado do carrinho durante o fluxo de Reserva -> Checkout -> Sucesso, evitando perda de dados se o usuário der "Refresh".
*   **Webcam na Portaria:** Certifique-se de pedir a permissão da câmera (Browser Permissions) de forma amigável: *"O Rolê Brasil Validador precisa acessar sua câmera para ler os QRs"*.
*   **Responsividade do Mapa:** O mapa de assentos em telas mobile deve estar dentro de um container com `overflow: auto` (ou touch-action: pan-x pan-y) para permitir que o usuário role pelo mapa sem quebrar o layout da página.
*   **Feedback de Pagamento:** Para a simulação, use `setTimeout` de uns 2 segundos com um *spinner* no botão de pagamento para simular a comunicação com o gateway bancário, melhorando a percepção de realismo (Feedback de Processamento).
