# Repository Guidelines

## Project Structure & Module Organization
- Source: `src/app` (routes: `page.tsx`, `layout.tsx`, `globals.css`), `src/components` (UI), `src/lib` (`supabaseClient.ts`).
- Assets: `public/` (static), `docs/` (docs, screenshots).
- SQL: `database_migration.sql`, `enable_rls.sql`, `cleanup_tasks.sql` (run in Supabase).
- Path alias: import via `@/*` for anything under `src/`.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server (Turbopack) on 3000.
- `npm run build`: Production build.
- `npm start`: Serve production build.
- `npm run lint`: Lint with ESLint (Next core-web-vitals).
- First-time setup: `cp .env.local.example .env.local` and fill Supabase vars.

## Coding Style & Naming Conventions
- TypeScript, strict mode; 2-space indentation.
- Components: PascalCase files in `src/components` (e.g., `TaskCard.tsx`); functions/hooks camelCase (`useX`).
- Imports: prefer `@/...` alias instead of relative paths.
- Tailwind v4 utilities for styling; keep class names readable and grouped logically.
- Fix all lint errors locally before opening PRs.

## Testing Guidelines
- E2E: Playwright is available. Place specs in `tests/e2e/*.spec.ts`.
- Run: `npx playwright install` then `npx playwright test`.
- Screenshots: `node screenshot.js` (expects app on `http://localhost:3001`).
- Aim to cover core flows: create, drag, update, complete, archive tasks.

## Commit & Pull Request Guidelines
- Commits: short, imperative, and scoped (e.g., “Fix quadrant info dialog”, “Enhance reports sidebar UI”).
- PRs: include summary, linked issues, test steps, and UI screenshots; note any SQL or env changes.
- Ensure `npm run lint` and `npm run build` pass. Do not commit `.env.local`.

## Security & Configuration Tips
- Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; optional `NEXT_PUBLIC_APP_PASSWORD` for production guard.
- Never commit secrets; use `.env.example` as reference.
- Enable/verify Supabase RLS in production (`enable_rls.sql`).

