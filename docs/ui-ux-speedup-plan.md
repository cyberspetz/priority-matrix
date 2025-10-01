# UI/UX Speed Improvement Plan

## Overview

Goal: elevate Priority Matrix to Todoist-level responsiveness while keeping design polish intact. Focus on interaction latency, perceived performance, and smoothness across desktop and mobile.

## 1. Baseline & Benchmarks

- Instrument Core Web Vitals (LCP, FID, CLS, INP) via Lighthouse CI & Web Vitals library.
- Record React Profiler traces for initial load, quadrant drag, inline edit, detail sheet open/close.
- Capture Supabase query timings (initial fetch, project switch, save/update) to identify network bottlenecks.
- Produce screen recordings to document current jank/hitches for later comparison.

## 2. Target Experience (Todoist-inspired)

- Board load < 1s; first task render by 600 ms on broadband.
- Interaction latency (drag start, inline edit save) under 100 ms; view switches under 200 ms.
- Consistent 60 fps animations on modern laptops; graceful degradation on low-power devices.
- Instant feedback: optimistic updates with fast fallback reconciliation, subtle transitions.

## 3. Optimization Workstreams

### A. Rendering & State Management
- Profile `src/app/page.tsx`; split heavy logic into contexts or state slices with selectors.
- Memoize `TaskCard`, `TaskInlineEditor`, `TaskListItem`; guard with `React.memo` + key equality functions.
- Convert expensive derived calculations (quadrant filters, counts) into `useMemo` with stable deps.
- Employ React 19 `useOptimistic` for inline edits and drag reorder previews.
- Gate `FluidBackground` updates when drag inactive; expose toggle for low-power mode.

### B. Data Fetching & Caching
- Parallelize tasks/projects fetch; cache results via SWR/react-query style hook.
- Lazy-load large views (Reports, Detail sheet) with suspense boundaries.
- Scope Supabase queries by project/quadrant; add pagination or limit for long lists.
- Integrate Supabase real-time channels for incremental updates, reducing full refetches.

### C. Interaction Smoothness
- Virtualize quadrant lists (`react-virtual` or custom) when task count exceeds threshold.
- Prefetch detail sheet data on hover/focus; keep sheet mounted but hidden to avoid re-render cost.
- Instant inline editor close: queue network save, show toast on failure, revert optimistically if needed.
- Tune `@dnd-kit` sensors (activation constraints, collision strategy) for snappier drag start.

### D. Motion & Visual Polish
- Replace heavy box shadows/backdrop filters with GPU-friendly transforms.
- Implement `prefers-reduced-motion` variants; keep animations under 150 ms.
- Align easing curves with Todoist (standard cubic-bezier(0.4, 0, 0.2, 1)).
- Review Tailwind class composition to minimize layout thrash.

### E. Bundles & Assets
- Analyze bundles with `next build --analyze`; split optional features (Reports, Password gate) via dynamic import.
- Tree-shake unused Supabase helpers and icon sets.
- Compress SVGs/PNGs; consider CSS gradients for backgrounds where possible.
- Lazy-load Playwright/debug tooling only in dev.

## 4. Implementation Roadmap

| Phase | Focus | Deliverables |
| --- | --- | --- |
| 1 | Baseline & goals | Metrics dashboard, profiling artifacts, target KPI doc |
| 2 | Rendering/state | Refactored state management, memoized components, reduced re-renders |
| 3 | Data & interactions | Cached queries, virtualized lists, optimistic save pipeline |
| 4 | Motion & polish | Updated animation system, reduced visual heavy effects |
| 5 | QA & regressions | Automated perf tests, Lighthouse CI thresholds, final report |

Each phase concludes with metric comparison to baseline and a lightweight retro.

## 5. Measurement & QA Loop

- Run Lighthouse CI & WebPageTest on key pages each phase; track deltas.
- Add Playwright perf assertions (e.g., inline edit save < 100 ms observed).
- Monitor Supabase logs for slow queries; adjust indices/migrations as needed.
- Collect qualitative feedback from pilot users focusing on perceived speed.

## 6. Dependencies & Risks

- Supabase latency can dominate — consider edge caching or row-level denormalization if required.
- Virtualization may complicate drag-and-drop; plan integration tests.
- Dynamic imports must preserve hydration integrity; ensure suspense boundaries handle SSR.
- Fluid background contributes to GPU load; ensure fallback for low-end hardware.

## 7. Next Steps

1. Schedule baseline profiling session and document results in `docs/perf-baseline.md`.
2. Draft KPI agreement with stakeholders (product, design).
3. Create engineering tickets aligned with phases; include acceptance criteria tied to metrics.
4. Stand up metrics dashboard (Datadog, Vercel Analytics, or custom Next + Supabase logging).

This plan should be revisited after each phase to incorporate findings and adjust priorities.

