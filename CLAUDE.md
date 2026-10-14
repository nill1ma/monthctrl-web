@AGENTS.md

# monthctrl-web

Personal finance tracking app. Log income and expenses grouped by reference period (month/year). Built with Next.js 16 + Supabase + Tailwind CSS v4.

## Essential commands

Run from the project root (`monthctrl-web/`):

```bash
npm run dev          # development server (localhost:3000)
npm run build        # production build (includes TypeScript check)
npm test             # unit tests (Jest)
npm run test:watch   # unit tests in watch mode
npm run test:e2e     # E2E tests (Playwright) — requires dev server running
```

## Architecture

### Routing (Next.js App Router)
- `app/login/` — public authentication page
- `app/(protected)/` — protected routes (middleware redirects without session)
  - `list/` — records list grouped by reference period
  - `details/[reference]/` — period detail: incomings and expenses
  - `create/` — create income or expense
  - `edit/[type]/[id]/` — edit a record
  - `profile/` — user profile and password change

### Layers
```
app/
├── services/        # Supabase calls — never use supabase client directly outside here
│   ├── incomings/
│   ├── expenses/
│   ├── incomings_expenses_transactions/
│   ├── profiles/
│   └── auth/
├── hooks/           # React Query wrappers over services
├── components/      # reusable components
│   ├── ui/          # primitives (Button, Input, Pagination…)
│   ├── forms/       # IncomingForm, ExpenseForm, LoginForm, CommonFields
│   └── TransactionDetailsList/
├── i18n/            # internationalization
│   ├── en.ts / pt.ts / es.ts   # translations
│   ├── LocaleContext.tsx        # global locale state
│   └── Provider.tsx             # IntlProvider + LocaleProvider
├── providers/       # ThemeProvider (next-themes), ReactQueryProvider
└── lib/             # utilities (currency, auth helpers)
```

## Internationalization (i18n)

- **Library**: `react-intl`
- **Available locales**: `en`, `pt`, `es`
- **Locale persisted** in `localStorage` under key `"monthctrl-locale"`
- **Rule**: every user-visible string must exist in all three translation files (`app/i18n/en.ts`, `pt.ts`, `es.ts`) and be accessed via `useIntl().formatMessage({ id })` or `<FormattedMessage id="" />`
- Never add hardcoded text in JSX

## Theming (dark/light)

- **Library**: `next-themes` with `attribute="data-theme"`
- Theme is applied as `data-theme="dark"` on `<html>`
- **Design system**: `@developmentsnil/awake-ui` — components use `var(--color-awake-neutral-dark-*)` under `[data-theme="dark"]`
- **Project semantic tokens** (defined in `globals.css`):
  - `--color-background`, `--color-background-element`, `--color-background-selected`
  - `--color-text`, `--color-text-secondary`, `--color-border`
- Never use hardcoded colors in CSS — always use the tokens above or awake-ui tokens

## CSS

- Tailwind CSS v4 with `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- Dark mode via `[data-theme="dark"]` — **do not** use Tailwind's `dark:` variant
- Each page/component has its own `styles.css` imported locally

## UI Components

- `Button`, `Input`, `Pagination` — custom components in `app/components/ui/`
- `Dialog`, `Button` (variants), `Separator` — from awake-ui (`@developmentsnil/awake-ui/*`)
- **Do not use** awake-ui's `Select` for the currency picker (portal/dark mode issues) — use the custom combobox already implemented in `list/page.tsx`

## Supabase

- SSR client via `app/lib/auth.ts`
- Required environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- All database access logic lives in `app/services/` — never instantiate the client directly in components

## Key types

```ts
// incomings.types.ts
type DetailsIncomingData = Pick<Incoming, 'id' | 'value' | 'origin' | 'currency'>

// expenses.types.ts
type DetailsExpenseData = Pick<Expense, 'id' | 'value' | 'destination' | 'currency'>

// incomings_expenses_transactions.types.ts
interface ReferenceGroup { reference: string; currencies: CurrencyEntry[] }
```

## Known pitfalls

- `getIncomingByReference` and `getExpenseByReference` return `currency` in the SQL — the return type must include `'currency'` in the `Pick`
- `ReferenceDate` uses `useLocale()` to format dates in the current locale — do not use `'default'` in `toLocaleString`
- `ThemeProvider` uses `scriptProps={{ suppressHydrationWarning: true }}` to suppress the React warning about next-themes' inline `<script>`
- The login layout uses `grid-column: 1 / -1` to span the sidebar column (which doesn't exist on the login page)
