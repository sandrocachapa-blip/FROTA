# FleetOps — Gestão de Frota

Aplicação full-stack para gerir viaturas, abastecimentos, manutenção, documentos, custos e alertas. A interface está em português, adaptada a valores em Kz e preparada para utilização em computador, tablet e telemóvel.

## Funcionalidades

- Dashboard executivo com disponibilidade, custos e gráficos mensais
- Cadastro e estado operacional das viaturas
- Atribuição de condutor e centro de custo
- Registo de abastecimentos, litros, fornecedor e quilometragem
- Manutenção preventiva/correctiva e histórico de custos
- Seguros, inspecções e alertas automáticos de validade
- Relatório por centro de custo, impressão e exportação CSV
- Tema claro/escuro e interface responsiva
- Modo de demonstração sem base de dados
- API validada com Zod e operações PostgreSQL via Drizzle ORM

## Stack

- Next.js 16 com App Router e TypeScript
- React 19 e Tailwind CSS 4
- shadcn/ui (Base UI) e Lucide Icons
- PostgreSQL na Neon
- Drizzle ORM + Neon Serverless Driver
- Recharts para visualização de dados
- Vercel para deployment

## Arranque local

Requisitos: Node.js 20 ou superior e uma base PostgreSQL Neon.

```bash
npm install
cp .env.example .env.local
```

Edite `.env.local` e coloque a connection string da Neon:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

Depois crie as tabelas, carregue os dados iniciais e inicie a aplicação:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

Sem `DATABASE_URL`, a interface abre automaticamente em modo de demonstração. Nesse modo, as operações de escrita permanecem bloqueadas para não transmitir uma falsa sensação de persistência.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | Análise ESLint |
| `npm run typecheck` | Validação TypeScript |
| `npm run db:generate` | Gerar nova migração a partir do schema |
| `npm run db:migrate` | Aplicar migrações à Neon |
| `npm run db:push` | Sincronizar schema durante desenvolvimento |
| `npm run db:seed` | Repor/carregar dados de demonstração |
| `npm run db:studio` | Abrir o Drizzle Studio |

> Atenção: `db:seed` remove os registos existentes das quatro tabelas antes de carregar a demonstração. Use apenas numa base nova ou de testes.

## Deploy na Vercel

1. Importe o repositório no painel da Vercel.
2. Confirme o framework **Next.js**.
3. Adicione `DATABASE_URL` em **Settings → Environment Variables**.
4. Execute `npm run db:migrate` localmente com a mesma connection string.
5. Faça o deploy. O ficheiro `vercel.json` já selecciona a região europeia `fra1`.

Também pode usar a CLI:

```bash
npx vercel
npx vercel env add DATABASE_URL production
npx vercel --prod
```

## Estrutura principal

```text
src/
├── app/
│   ├── api/                 # API REST (CRUD)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── fleet/fleet-app.tsx  # Interface e fluxos da aplicação
│   └── ui/                  # Componentes shadcn/ui
└── lib/
    ├── db/                  # Schema, ligação, queries e seed
    ├── demo-data.ts
    ├── fleet-types.ts
    └── validation.ts
```

## Qualidade e segurança

- `.env` e credenciais não entram no Git
- Validação de payloads no servidor
- Chaves estrangeiras com eliminação em cascata controlada
- Migrações SQL versionadas
- Pipeline CI executa TypeScript, ESLint e build em cada push/PR
