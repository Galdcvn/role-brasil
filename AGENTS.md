# Diretrizes para Agentes de IA

## Tech Stack
- **Frontend/UI:** React, Tailwind CSS
- **Linguagem:** TypeScript
- **Database/ORM:** PostgreSQL (Supabase), Prisma
- **Testes:** Jest (server) + Vitest (client)

## Regras Inegociáveis (Regras Negativas)
- **NÃO** instale bibliotecas `npm`, `yarn` ou `pnpm` adicionais sem autorização prévia e explícita no chat.
- **NÃO** utilize `any` nas definições de tipos do TypeScript. Use tipagem estrita, `unknown` ou Generics quando a tipagem exata for dinâmica.
- **NÃO** utilize Herança de classes para reaproveitamento de código; prefira **Composição**.
- **⚠️ ATUALIZE O README.md E O ARCHITECTURE.md** após CADA implementação ou decisão significativa. Isso é **obrigatório** e **não pode ser esquecido**. O `README.md` recebe a linha do tempo com decisões; o `ARCHITECTURE.md` recebe a descrição atualizada do módulo/fluxo. Faça isso **antes** de commitar.

## Princípios & Qualidade de Código

- **KISS (Keep It Simple, Stupid):** O código deve ser simples e direto. Evite sobre-engenharia, abstrações prematuras ou soluções desnecessariamente complexas.
- **DRY (Don't Repeat Yourself):** Cada regra de negócio ou lógica central deve ter uma representação única. Extraia rotinas repetidas para custom hooks, utilitários ou serviços reutilizáveis.
- **Clean Code:** 
  - Nomes de variáveis, funções e componentes devem ser autoexplicativos.
  - Funções pequenas e focadas em fazer apenas uma coisa bem feita.
  - Elimine comentários redundantes (o código deve se explicar sozinho).
- **SOLID:**
  - **S (Single Responsibility):** Módulos, componentes e serviços devem ter apenas um motivo para mudar.
  - **O (Open/Closed):** Código aberto para extensão, mas fechado para modificação.
  - **L (Liskov Substitution):** Tipos derivados devem ser totalmente substituíveis pelos seus tipos base.
  - **I (Interface Segregation):** Crie interfaces/types enxutos e específicos em vez de interfaces monolíticas.
  - **D (Dependency Inversion):** Módulos de alto nível não devem depender de módulos de baixo nível; ambos devem depender de abstrações (interfaces/types).
- **Composição sobre Herança:** Dê preferência absoluta à composição de objetos e componentes React (via props, render props ou custom hooks) em vez de hierarquias de herança.
- **Lei de Demeter (Princípio do Menor Conhecimento):** Reduza o acoplamento em cadeia. Um método ou função deve interagir apenas com suas dependências diretas (evite encadeamentos profundos como `objeto.getA().getB().doSomething()`).
- **Design Patterns (GoF):** Utilize padrões de projeto consagrados (ex: *Strategy, Factory, Adapter, Observer*) para resolver problemas estruturais recorrentes em vez de reinventar a roda.

## Fluxo de Trabalho (Workflow Modularizado)

### 1. Desenvolvimento Modular
- Execute tarefas de forma estritamente modularizada passo a passo.
- **NÃO** crie blocos muito extensos de desenvolvimento de uma só vez. 
- Divida funcionalidades em fatias pequenas (ex: 1. Schema/Prisma -> 2. Lógica de Serviço -> 3. Componentes React -> 4. Integração). Aguarde aprovação ou sucesso da etapa antes de codificar a próxima.
- **NÃO** rode nenhuma migration sem autorização explícita.

### 2. Desenvolvimento Guiado a Testes
- Para CADA bloco de execução desenvolvido, crie ou atualize os testes automatizados em **Jest**.
- A cobertura de testes (coverage) de cada bloco e do projeto total deve ser sempre garantida em, no mínimo, **85%**.

### 3. Validação Contínua (Checkpoint entre Módulos)
- Entre a conclusão de um módulo de execução e o início do próximo, você deve verificar (ou solicitar a execução de):
  - **Typecheck:** Validação do compilador TypeScript (`npx tsc --noEmit` ou equivalente).
  - **Lint:** Verificação de formatação e regras (`npm run lint`).
  - **Build:** Garantir que o projeto compila.
  - **Testes & Coverage:** Executar `npm test -- --coverage`.
- **Correção Estrita:** Ao encontrar erros nas validações acima, forneça o código para correção focando **estritamente** na resolução desses problemas. Não faça refatorações de escopo fora do erro apontado.
- Avance para a próxima etapa/módulo **apenas** quando os testes passarem com sucesso, a cobertura de 85% for confirmada, e o **README.md + ARCHITECTURE.md** estiverem atualizados.

### 4. Registro das atividades (OBRIGATÓRIO — NÃO ESQUEÇA)
- **ANTES de commitar**, atualize:
  1. **`README.md`** → adicione entrada na linha do tempo (decisão, contexto, como a IA refinou).
  2. **`ARCHITECTURE.md`** → atualize a descrição do módulo/fluxo afetado.
- Se a mudança é apenas de bugfix ou refatoração sem impacto arquitetural, atualize apenas o `README.md` com a entrada na timeline.
- **NÃO faça commit sem atualizar esses arquivos.** Eles são a memória do projeto.