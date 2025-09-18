# Repository Guidelines

## Project Structure & Module Organization
- Source under `src/app` with route files `page.tsx`, `layout.tsx`, `globals.css`; UI components live in `src/components` (PascalCase); shared utilities and Supabase client code stay in `src/lib`.
- Assets: static files in `public/`, docs & captures in `docs/`, database artifacts in `db/` (`migrations/`, `policies/`, `maintenance/`). Follow execution order outlined in `db/README.md` when applying SQL.
- Tests: Playwright specs reside in `tests/e2e/*.spec.ts`. Use the `@/...` path alias across the codebase.

## Build, Test, and Development Commands
- `npm run dev`: start the Next.js dev server (Turbopack) on port 3000.
- `npm run build`: generate the production bundle; run before merging significant changes.
- `npm start`: serve the production build locally.
- `npm run lint`: execute ESLint with Next.js core-web-vitals; resolve findings before PRs.
- `npm run migrate` / `npm run migrate:info`: apply or inspect Flyway migrations via Docker.
- `npx playwright install` / `npx playwright test`: set up and run the Playwright E2E suite.

## Coding Style & Naming Conventions
- TypeScript in strict mode with 2-space indentation; prefer Tailwind v4 utility classes grouped logically.
- Components in `src/components` use PascalCase filenames, hooks stay camelCase (`useSupabaseClient`), and route files follow Next.js defaults.
- Prefer `@/...` imports over relative paths. Keep comments purposeful and minimal.

## Testing Guidelines
- Place E2E specs in `tests/e2e/` with descriptive names (e.g., `tasks-flow.spec.ts`) covering create, drag, update, complete, and archive flows.
- Run `npx playwright test` before PRs; capture screenshots via `node screenshot.js` when debugging UI (requires app on `http://localhost:3001`).
- Document flaky or skipped tests in PR notes and schedule follow-up fixes.

## Commit & Pull Request Guidelines
- Commits: short, imperative, and scoped (e.g., “Enhance reports sidebar UI”); mention DB or env changes in the body.
- PRs: include a summary, linked issues, test results, and relevant UI screenshots; note SQL or configuration updates and confirm `npm run lint && npm run build`.

## Security & Configuration Tips
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; optional `NEXT_PUBLIC_APP_PASSWORD` guards production access.
- Never commit secrets; rely on `.env.example`. Keep Supabase RLS enabled via policies in `db/policies/` and scripts like `enable_rls.sql`.
