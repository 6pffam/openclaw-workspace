# Success

**Status:** IN PROGRESS
**Started:** 2026-05-31
**Goal:** Executive project timeline dashboard — upload Excel data, define iterations, set priorities, visualise Gantt chart, export reports and track task dependencies.

---

## Phase 1 — Foundation

- [x] Next.js scaffold at workspace/success/, port 3004
- [x] SQLite schema (projects, project_rows, iterations, row_priorities, row_dependencies)
- [x] PIN-based auth + lock screen
- [x] LaunchAgent + restart.sh for reliable deploys

## Phase 2 — Data Input

- [x] Excel upload and parse (Input tab)
- [x] Column header detection and type assignment
- [x] Project creation from uploaded file
- [x] Archive tab — browse past imports

## Phase 3 — Iterations & Priorities

- [x] Iterations CRUD (create, rename, archive)
- [x] Per-row priority assignment (Critical / High / Medium / Low / Exclude)
- [x] Start date / end date / due date per row in an iteration
- [x] Row dependencies within an iteration

## Phase 4 — Gantt Report

- [x] Gantt chart with activity bars (start→end) and diamond milestones (due date)
- [x] Dependency arrows between rows (curved bezier, colour-coded by priority)
- [x] Date axis, priority legend, summary stats
- [x] Project + iteration selector with URL params
- [x] Print / PDF export
- [x] Export Image (3× pixel ratio PNG via html-to-image)

## Phase 5 — Tasks

- [x] Task steps definition per project
- [x] Assign tasks to data rows (bulk select, filter by priority/assignment)
- [x] Task dependencies (depends-on links between tasks)
- [x] Dependency dropdown fix — position: fixed portal, never clipped

## Phase 6 — Polish & Remaining

- [ ] README for the project
- [ ] Mobile-responsive layouts (Input, Priorities, Report tabs)
- [ ] Gantt date zoom / horizontal scroll for dense timelines
- [ ] Shareable report link (read-only public view)
