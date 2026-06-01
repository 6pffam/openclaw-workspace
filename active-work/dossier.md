# Dossier

**Status:** COMPLETE
**Started:** 2026-05-28
**Goal:** Build Dossier — a background check dashboard for OpenClaw. Web app on localhost:3002. Users create Cases, populate category inputs, trigger SCOUT to research, get back a polished executive summary (Results Viewer).

---

## Phase 1 — Foundation + Case Dashboard ✅ COMPLETE

**Phase 1 Complete — shipped 2026-05-28**
**Local URL:** http://localhost:3002

- [x] Init Next.js 15 app at `workspace/dossier/`, port 3002
- [x] Tailwind + shadcn/ui setup
- [x] SQLite schema (cases, versions, categories)
- [x] REST API routes: GET /api/cases, POST /api/cases, GET /api/workspace-stats
- [x] Case Dashboard UI (Google Finance aesthetic — white, flat, minimal)
- [x] Case cards: name, intent snippet, timestamp, status chip (draft/running/ready)
- [x] Empty state with CTA
- [x] New Case modal (name + intent)
- [x] Sidebar with real workspace stats (crew count, artifact count, last memory date)
- [x] Crew list in sidebar with status dots
- [x] Build passes clean, LaunchAgent service registered

## Phase 2 — Case Detail / Editor ✅ COMPLETE

- [x] Route: /cases/[id]
- [x] Full category form (Intent, Company, Individual, Time Range, Topic, Keyword, Links, Exclusions)
- [x] Add / rename / delete categories
- [x] Version history sidebar/timeline
- [x] Save Version button (snapshots categories as new version in SQLite)
- [x] Run SCOUT button (writes case JSON → Gateway /tools/invoke → sessions_send to SCOUT)
- [x] 5s polling for Running → Ready status flip
- [x] Breadcrumb nav + inline-edit case name and intent
- [x] 800ms debounce auto-save with Saving/Saved indicator

## Phase 3 — Results Viewer ✅ COMPLETE

- [x] Route: /cases/[id]/results/[version]
- [x] Reads dossier/results/<case-id>-v<version>.md via gray-matter
- [x] Editorial layout: 760px centered, generous whitespace, blue left-bar section accents
- [x] Sections as distinct visual blocks via react-markdown (Key Findings, Entities, Timeline, Sources)
- [x] Source link cards from frontmatter
- [x] Print-friendly CSS (@media print)
- [x] Not-ready state polls every 5s until file appears
- [x] Version sidebar "View Results →" linked
- [x] Seeded test results file for Acme Corp scenario

## Phase 4 — SCOUT + SCRIBE Wiring ✅ COMPLETE

- [x] SCOUT AGENTS.md updated: reads Dossier case JSON, runs Brave Search, fetches URLs, cross-references wiki, writes results in correct format
- [x] SCRIBE AGENTS.md updated: knows Dossier results format for reference
- [x] dossier/results/ and dossier/cases/ directories created
- [x] Gateway token read at runtime from secrets.json (not hardcoded)
- [x] End-to-end flow ready: create case → fill categories → Save Version → Run SCOUT → Ready → Results Viewer

---

## Key Decisions
- Port: 3002 (3000 = Nexus, 3001 = Universe)
- Results format: markdown with YAML frontmatter
- Results path: dossier/results/<case-id>-v<version>.md
- Trigger: Next.js → write JSON snapshot → Gateway /tools/invoke → sessions_send SCOUT
- Standalone app (not integrated into Nexus)
- SCOUT model: claude-sonnet-4-6 (upgraded from haiku)
- Brave search: inherited globally, no Perplexity on day one
- Persistent LaunchAgent services for Nexus, Universe, Dossier

## Stack
- Next.js 16 (App Router) + Tailwind + shadcn/ui + react-markdown
- better-sqlite3 for SQLite
- Gateway HTTP API at localhost:18789 for SCOUT trigger
- LaunchAgent at ~/Library/LaunchAgents/ai.openclaw.dossier.plist
