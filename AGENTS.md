# AGENTS HANDOVER

Updated: 2025-09-30

This file captures the current state of the Priority Matrix project so the next agent can ramp up quickly. Treat it as a living document—update when large features land, flows change, or infra/config evolves.

## Product Snapshot

- Eisenhower-style task manager with four quadrants, drag-and-drop reordering, inline editing, and Supabase persistence.
- Views: Inbox (board), Today, Upcoming; each scoped to the selected project.
- Projects: default + custom projects with per-project quadrants and layouts; inline project creation supported.
- Detail sheet for rich task editing, quick schedule menu, quick actions.
- Password-protected shell in production via `NEXT_PUBLIC_APP_PASSWORD`.

## Recent Changes (Fall 2025)

- Added inline editor close-on-save fix (`TaskCard`), ensuring `onExitEdit` fires after successful save.
- Expanded Supabase schema with sort indices, deadlines, project layouts (`db/migrations` ending 20241006).
- Introduced project modal, quick schedule menu, reports sidebar, password protection gate.
- DnD ordering now scoped per project/quadrant; optimistic updates with reconciliation.
- Tests improved: Playwright specs cover actions menu, quick schedule, mobile layout.

## Frontend Architecture

- `src/app/page.tsx` orchestrates views, DnD, Supabase data fetching/mutations, and modal/sheet state.
- Components in `src/components/` (PascalCase): `TaskCard`, `TaskInlineEditor`, `TaskDetailSheet`, `QuickScheduleMenu`, `ProjectModal`, etc.
- Styling via Tailwind; shared priority helpers in `src/lib/priority.ts`.
- Supabase client + typed models in `src/lib/supabaseClient.ts` (includes project/task APIs).
- Route layout and global styles in `src/app/layout.tsx` and `globals.css`.

## Data Layer & Supabase

- Tables: `tasks`, `projects`, supporting sort indices, deadlines, quadrant, status fields.
- RLS enabled; dev policy script in `db/policies/20240917_enable_rls_dev.sql`.
- Flyway migrations under `db/migrations/`; run via Docker (`npm run migrate`). See `db/README.md` for order.
- `TaskUpdatePayload` ensures partial updates; inline editor trims title/notes and nulls empty notes.

## Key Flows

- **Load**: `page.tsx` fetches tasks/projects on mount, sets default project.
- **Drag & Drop**: `Quadrant` + `TaskCard` via `@dnd-kit`; reorders with per-project sort indexes.
- **Inline Edit**: `TaskCard` toggles to `TaskInlineEditor`; `onExitEdit` resets editing state.
- **Detail Sheet**: `TaskDetailSheet` for full CRUD; syncs with Supabase mutations.
- **Quick schedule**: `QuickScheduleMenu` surfaces date presets and due/deadline edits.

## Commands & Tooling

- Dev server: `npm run dev` (Next.js 15 + Turbopack).
- Build: `npm run build`; Prod start: `npm start`.
- Lint: `npm run lint` (core-web-vitals rules).
- Tests: `npx playwright install`, `npx playwright test` (see `tests/e2e/`).
- Screenshots for debugging: `node screenshot.js` (requires local app running on port 3001).

## Testing & QA Notes

- Prioritize E2E coverage for task creation, drag, edit, complete, archive flows.
- Today/Upcoming views rely on local date utilities—watch timezone regressions.
- RLS must remain enabled; ensure new SQL respects policies.
- Check for Supabase network errors; fallback refetch logic exists in `page.tsx`.

## Pending / Future Ideas

- Add project-based filters to reports sidebar.
- Expand Playwright coverage to detail sheet and project creation.
- Consider realtime sync via Supabase channels (currently polling/manual refresh).
- Add toast notifications for mutations (currently silent except console logging).

## Quick Reference

- Active views toggled via `SidebarNav` (Inbox, Today, Upcoming).
- Drag overlay preview lives in `page.tsx` `DragOverlay` block.
- Inline editor menus handle due/priority/deadline chips; keep them accessible-friendly.
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `NEXT_PUBLIC_APP_PASSWORD`.
