# Diretrizes para Agentes de IA

## Tech Stack
- **Frontend/UI:** React, Tailwind CSS
- **Linguagem:** TypeScript
- **Database/ORM:** PostgreSQL (Supabase), Prisma
- **Testes:** Jest

## Regras Inegociáveis (Regras Negativas)
- **NÃO** instale bibliotecas `npm`, `yarn` ou `pnpm` adicionais sem autorização prévia e explícita no chat.
- **NÃO** utilize `any` nas definições de tipos do TypeScript. Use tipagem estrita, `unknown` ou Generics quando a tipagem exata for dinâmica.

## Fluxo de Trabalho (Workflow Modularizado)

### 1. Desenvolvimento Modular
- Execute tarefas de forma estritamente modularizada passo a passo.
- **NÃO** crie blocos muito extensos de desenvolvimento de uma só vez. 
- Divida funcionalidades em fatias pequenas (ex: 1. Schema/Prisma -> 2. Lógica de Serviço -> 3. Componentes React -> 4. Integração). Aguarde aprovação ou sucesso da etapa antes de codificar a próxima.
- **NÃO** rode nenhuma migartion sem autorização explícita.

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
- Avance para a próxima etapa/módulo **apenas** quando os testes passarem com sucesso e a cobertura de 85% for confirmada.

### 4. Registro das atividades
- Sempre que terminar uma implementação lembre de atualizar o ARCHTECTURE.md, se for cabível, e adicionar ao README atualizações sobre o sistema e sobre as decisões tomadas na linha do tempo, Deixando claro minhas as minhas decisões e como usei a IA para melhorar refinar elas.