# Dados de Teste — Rolê Brasil

## Contas de Seed (todas com senha `Senha@123`)

| Papel | Email | Descrição |
|-------|-------|-----------|
| Organizador | `organizador@rolebrasil.com` | Cria eventos, gerencia sessões e assentos |
| Cliente | `maria@rolebrasil.com` | Compra ingressos, favorita eventos |
| Cliente | `pedro@rolebrasil.com` | Compra ingressos, favorita eventos |
| Portaria | `ana@rolebrasil.com` | Valida ingressos na entrada do evento |

## Evento Seed

- **Título:** Rock in Rio 2026
- **Status:** PUBLICADO
- **Sessões:** 15/09/2026 20:00 e 16/09/2026 20:00
- **Assentos:** 5 fileiras (A-E) × 12 assentos = 60 por sessão
- **Categorias:** INTEIRA (R$ 300,00), MEIA (R$ 150,00), GRATUIDADE (Grátis)

---

## Fluxo Passo-a-Passo

### 1. Cadastro e Login

1. Acesse `/cadastro`
2. Preencha nome, email e senha (ou use uma conta seed)
3. Faça login em `/login`

### 2. Fluxo do Organizador

1. Login com `organizador@rolebrasil.com`
2. Acesse **Meus Eventos** na sidebar
3. Clique em **Novo Evento** → preencha título, descrição, endereço, categorias
4. Na página do evento, crie sessões (data/hora, fileiras, assentos por fileira)
5. Publique o evento (status → PUBLICADO)

### 3. Fluxo do Cliente (Compra)

1. Login com `maria@rolebrasil.com`
2. Na página inicial, navegue até o evento "Rock in Rio 2026"
3. Selecione uma sessão
4. Escolha assentos no mapa teatral (clique nos assentos verdes)
5. Selecione a categoria (INTEIRA/MEIA/GRATUIDADE)
6. Clique em **Comprar**
7. Escolha PIX (aprovação automática) ou Cartão (CVV `000` = recusa)
8. Após aprovação, acesse **Meus Ingressos** para ver o QR Code

### 4. Fluxo de Portaria

1. Login com `ana@rolebrasil.com`
2. Acesse **Validar Ingresso**
3. Selecione o evento (opcional)
4. Digite o código do ingresso ou escaneie o QR Code
5. **INTEIRA:** aprovação automática → resultado APROVADO
6. **MEIA/GRATITUDE:** resultado PENDENTE_DOCUMENTACAO → botões Confirmar/Rejeitar
7. Confirme ou rejeite a documentação
8. Consulte o histórico na aba **Histórico**

### 5. Cancelamento de Ingresso

1. Login com `maria@rolebrasil.com`
2. Acesse **Meus Ingressos** → clique no ingresso
3. Clique em **Cancelar Ingresso** → confirme
4. O assento volta a ficar disponível

### 6. Favoritos

1. Login com `pedro@rolebrasil.com`
2. Na página inicial, clique no ícone de favorito em um evento
3. Acesse **Favoritos** na sidebar para ver os eventos salvos

---

## Simulação de Pagamento

| Cenário | Cartão | CVV | Resultado |
|---------|--------|-----|-----------|
| Aprovação | Qualquer | Qualquer (exceto 000) | APROVADO |
| Recusa | Qualquer | `000` | RECUSADO |
| PIX | N/A | N/A | APROVADO (automático) |
