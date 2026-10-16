# Month Ctrl

Personal finance tracking app. Log income and expenses grouped by reference period (month/year), view balances, and convert amounts between currencies.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database / Auth | Supabase (PostgreSQL) |
| Styling | Tailwind CSS v4 |
| Design system | awake-ui (`@developmentsnil/awake-ui`) |
| Server state | TanStack React Query |
| Forms | React Hook Form + Zod |
| i18n | react-intl (EN / PT-BR / ES) |
| Theming | next-themes (light / dark / system) |
| Unit tests | Jest + React Testing Library |
| E2E tests | Playwright |
| Deploy | Vercel |

## Features

- Email and password authentication (Supabase Auth)
- Period list with income, expenses, and net balance per currency
- Real-time currency conversion across all periods
- Period detail: income and expenses broken down by currency
- Create and edit income and expense records
- Delete individual records or an entire period at once
- User profile and password change
- Light / dark / system theme
- English, Portuguese, and Spanish UI

## AI Agents

This project uses AI agents powered by Google Gemini that run automatically during development:

| Agent | Trigger | Behaviour |
|---|---|---|
| **a11y-agent** | pre-commit (Husky) | Detects WCAG 2.1 AA violations in staged components — blocks commit on errors |
| **i18n-agent** | pre-commit (Husky) | Detects hardcoded user-visible strings that should be in translation files — advisory only |
| **lint-agent** | manual | Runs ESLint on `app/` and explains each warning with AI |
| **pr-agent** | GitHub Actions (PR) | Reviews lint + Vercel deploy status and posts a comment on the PR |

See [`AGENTS.md`](./AGENTS.md) for full documentation.

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project with email authentication enabled

### Environment variables

Create `.env.local` at the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

For the AI agents, also add:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=<your-google-ai-studio-key>
```

For E2E tests, also add:

```bash
TEST_EMAIL=user@example.com
TEST_PASSWORD=password
```

### Install and run

```bash
npm install
npm run dev        # http://localhost:3000
```

### Production build

```bash
npm run build
npm start
```

## Tests

```bash
npm test                    # unit tests (Jest)
npm run test:watch          # unit tests in watch mode
npm run test:e2e            # E2E tests (Playwright) — requires dev server running
npx playwright show-report  # HTML report for E2E tests
```

## Project structure

```
app/
├── (protected)/              # protected routes (require a session)
│   ├── list/                 # period list
│   ├── details/[reference]/  # period detail
│   ├── create/               # new record
│   ├── edit/[type]/[id]/     # edit a record
│   └── profile/              # profile and password
├── login/                    # authentication
├── components/               # reusable components
│   ├── ui/                   # Button, Input, Pagination…
│   ├── forms/                # IncomingForm, ExpenseForm, LoginForm
│   └── TransactionDetailsList/
├── services/                 # Supabase access (incomings, expenses, profiles…)
├── hooks/                    # React Query wrappers
├── i18n/                     # translations and locale context
├── providers/                # ThemeProvider, ReactQueryProvider
└── lib/                      # utilities (currency, auth)
e2e/                          # Playwright tests
scripts/                      # AI agents
```

## Development

See [`CLAUDE.md`](./CLAUDE.md) for code conventions, i18n patterns, CSS rules, and known pitfalls.
