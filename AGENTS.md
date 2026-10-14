<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the work tree clean.

<!-- END:nextjs-agent-rules -->

# AI Agent Rules — monthctrl-web

## Before any change

1. Read `CLAUDE.md` at the project root.
2. Run `npm run build` locally to confirm TypeScript passes before and after your changes.
3. Never break the build — type errors are deploy blockers (Vercel).

## Text and i18n

- **Every user-visible string** must exist in all three files: `app/i18n/en.ts`, `app/i18n/pt.ts`, `app/i18n/es.ts`.
- Use `useIntl().formatMessage({ id: "key" })` in client-side components or `<FormattedMessage id="key" />` in JSX.
- When adding a new key, add it to all three files in the same operation.
- Variable interpolation: `formatMessage({ id: "key" }, { variable: value })` — the key uses `{variable}` in the message string.

## Theming and CSS

- Dark mode via `[data-theme="dark"]` in CSS — **never** use Tailwind's `dark:` variant.
- Colors via CSS tokens: `var(--color-background)`, `var(--color-text)`, etc. — never hardcoded hex values.
- Tailwind v4: use `@import "tailwindcss"` at the top of each `styles.css`, not the `@tailwind` directives.

## Services and data

- Supabase access **only** through functions in `app/services/`.
- When changing the SQL of a service (adding a column to `select`), update the function's return type to include the field in the `Pick<>`.
- React Query via hooks in `app/hooks/` — do not use `useQuery` directly in pages.

## Components

- Primitive UI components live in `app/components/ui/`.
- awake-ui components are imported as `@developmentsnil/awake-ui/<name>`.
- Do not use awake-ui's `Select` for portal-based pickers (use the custom combobox instead).

## Tests

- Unit tests: `app/**/*.spec.tsx` with Jest + React Testing Library.
- E2E tests: `e2e/*.spec.ts` with Playwright — require a running dev server and `TEST_EMAIL` / `TEST_PASSWORD` env vars.
- Run `npm test` after changes to hooks and services.

## Git

- Commit messages in English, imperative, with a clear scope: `fix(i18n): add missing es translations for details.net`.
- Do not commit `.env.local` or any credentials.
