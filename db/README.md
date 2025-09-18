# Database Scripts

This folder organizes all SQL needed for local setup and production maintenance.

## Layout
- `migrations/`: schema changes (Flyway versioned)
  - `V20240915__create_tasks.sql`: base schema (creates `tasks` with full columns)
  - `V20240916__enhanced_task_schema.sql`: adds extended fields, views, and indexes
  - `V20240918__add_sort_index.sql`: adds `sort_index` for manual ordering and related index
- `policies/`: RLS policies and related security scripts
  - `20240917_enable_rls_dev.sql`: enables RLS with permissive dev policy (replace for prod)
- `maintenance/`: one-off maintenance scripts
  - `20240915_cleanup_non_active_tasks.sql`: deletes non-active tasks

## Apply Order
Option A — Flyway (recommended)
- Prereq: Docker installed (local) OR use the GitHub Action below.
- Local: set DB_* vars in `.env.local` and run `npm run migrate`.
- Diagnostics: `npm run migrate:info`, repair metadata: `npm run migrate:repair`.

Option B — Manual (SQL Editor)
1) `migrations/V20240915__create_tasks.sql`
2) `migrations/V20240916__enhanced_task_schema.sql`
3) `migrations/V20240918__add_sort_index.sql`
4) (Optional) `policies/20240917_enable_rls_dev.sql`

## GitHub Action (CI/CD)
- Workflow: `.github/workflows/db-migrate.yml`
- Triggers: manual via Workflow Dispatch
- Inputs: `environment` (production/preview/development), `command` (migrate/info/validate/repair)
- Secrets: add these to each GitHub Environment used
  - `DB_HOST` (Supabase database host)
  - `DB_PORT` (usually 5432)
  - `DB_NAME` (usually `postgres`)
  - `DB_USER` (usually `postgres`)
  - `DB_PASSWORD` (database password from Supabase)
  - `DB_SCHEMA` (optional, default `public`)

Note: use Supabase “Database” connection info (not the REST anon key).

Run them in Supabase SQL Editor. All statements are idempotent using IF NOT EXISTS where applicable.

## Notes
- For production, replace the dev RLS policy with user-scoped policies tied to `auth.uid()`.
- After applying `sort_index`, the app persists drag-and-drop order within each quadrant.
