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

## AI Agents (scripts/)

The project has two automation scripts powered by Google Gemini (`gemini-3.8-flash`).

### `scripts/lint-agent.ts` — Local lint analysis

Runs ESLint on `app/` and `e2e/`, reads code snippets around each warning, and asks the AI to explain every problem and suggest a fix.

```bash
npm run lint:agent        # analyse app/ and e2e/
npm run lint:agent:src    # analyse app/ only
```

Requires `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`.

### `scripts/pr-agent.ts` — Automated PR review

Runs automatically on every PR via GitHub Actions (`.github/workflows/pr-review.yml`). For each PR it:

1. Lists the changed `.ts` / `.tsx` / `.js` / `.jsx` files via `git diff`.
2. Runs ESLint only on those files.
3. Sends the lint results + code snippets to Gemini, which generates a Markdown report in Portuguese.
4. Queries the Vercel API for the latest preview deploy status (READY / ERROR / BUILDING).
5. Posts a single comment on the PR with both the lint report and the Vercel status.

**Required GitHub secrets** (Settings → Secrets and variables → Actions):

| Secret | Description |
|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI Studio key (free tier, 20 req/day) |
| `GITHUB_TOKEN` | Injected automatically by GitHub Actions — no manual setup |
| `VERCEL_TOKEN` | Vercel account token (Account Settings → Tokens) |
| `VERCEL_PROJECT_ID` | Found in the Vercel project settings (project-specific) |

`VERCEL_TOKEN` is reusable across projects; only `VERCEL_PROJECT_ID` changes per project.

### `scripts/a11y-agent.ts` — Accessibility agent (pre-commit)

Runs automatically on every `git commit` via Husky. Checks staged `.tsx` / `.jsx` files in `app/` for WCAG 2.1 AA violations using ESLint `jsx-a11y` rules, then sends the results to Gemini for a detailed report with before/after code fixes.

**Rules enforced:**
- `alt-text` — images must have descriptive alt text
- `aria-props` / `aria-role` — valid ARIA attributes and roles
- `interactive-supports-focus` — interactive elements must be focusable
- `click-events-have-key-events` — click handlers need keyboard equivalents
- `label-has-associated-control` — form labels must be linked to inputs
- `anchor-is-valid` — anchors must have valid href or role

**Behaviour:**
- 🔴 Errors → commit is **blocked** until fixed
- 🟡 Warnings → commit is allowed, report shown in terminal

**Setup** (already configured in this repo):
```bash
npm install --save-dev husky
npx husky init
# .husky/pre-commit contains: npx tsx scripts/a11y-agent.ts
```

Requires `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local`.

You can also run it manually:
```bash
# Em: monthctrl-web/
npm run a11y:agent
```
### `scripts/orchestrator.ts` — Pre-commit orchestrator

Runs automatically on every `git commit` via Husky. Coordinates the agents below in parallel and reports results. The commit is always released — agents are advisory, not blocking (except A11y errors).

### `scripts/i18n-agent.ts` — i18n agent (pre-commit)

Checks staged React components for hardcoded user-visible strings that bypass `react-intl`. Reports any string that should be a translation key.

### `scripts/test-runner-agent.ts` — Test runner agent (pre-commit)

Runs `npm test` on the full test suite and, if any tests fail, sends the output to Gemini for an explanation of the failures.

### `scripts/test-coverage-agent.ts` — Test coverage agent (pre-commit)

Analyses staged logic files (`app/lib/`, `app/hooks/`, `app/services/`) and identifies functions or branches without unit test coverage.


