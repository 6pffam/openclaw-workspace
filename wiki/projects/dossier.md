---
title: Project Dossier
type: project
status: active
updated: 2026-05-30
tags: [nextjs, dashboard, openclaw, typescript, sqlite, scout, shared-ui]
---

# Project Dossier

> Background check dashboard — a structured way to brief yourself before any high-stakes situation. Turns typed intent and keywords into a researched executive summary, delivered through SCOUT.

## Key Facts
- **Location:** `/Users/6pf/.openclaw/workspace/dossier`
- **Stack:** Next.js 16 (App Router), Tailwind, `@openclaw/ui` (shared-ui), better-sqlite3, react-markdown
- **Runs on:** localhost:3002 (Tailscale: http://100.64.128.24:3002)
- **Service:** `~/Library/LaunchAgents/ai.openclaw.dossier.plist` (auto-start, KeepAlive)

## Completed Screens
- **Case Dashboard** — list of all cases, status chips, New Case modal, real workspace stats sidebar
- **Case Detail / Editor** — category form (8 types), inline edit, auto-save, version history, Run SCOUT trigger
- **Results Viewer** — editorial executive summary, section blocks, print-ready, polls until SCOUT results land

## Data Model (SQLite at `dossier/data/dossier.db`)
- `cases` — id, name, intent, status, timestamps
- `versions` — snapshot of categories at save time, run status, results path
- `categories` — editable fields per case: intent, company, individual, time_range, topic, keyword, link, exclusion

## Agent Integration
- **SCOUT** — triggered via queue file. Case JSON written to `dossier/cases/queue/<id>-v<N>.json`, SCOUT picks it up on heartbeat, writes results to `dossier/results/`
- **SCRIBE** — aware of Dossier results format (reference only)
- Results format: markdown + YAML frontmatter at `dossier/results/<caseId>-v<N>.md`
- Queue dir: `dossier/cases/queue/` — one JSON file per pending run

## Key Files
- `app/page.tsx` — Case Dashboard
- `app/cases/[id]/page.tsx` — Case Detail / Editor
- `app/cases/[id]/results/[version]/page.tsx` — Results Viewer
- `app/api/cases/` — REST API routes
- `app/api/cases/[id]/versions/[vid]/run/route.ts` — writes queue file, sets version status to `running`
- `app/api/cases/[id]/versions/[vid]/status/route.ts` — polls DB; auto-heals if results file appears while status is `running`
- `lib/db.ts` — SQLite init and connection
- `dossier/cases/queue/` — pending SCOUT run queue (JSON files)
- `dossier/results/` — SCOUT output markdown files

## Visual Direction
Dark navy — matches Nexus and Universe via shared `@openclaw/ui` design system. shadcn/ui and all Radix UI packages removed (as of 2026-05-29). Mobile responsive: bottom tab nav, safe-area iPhone padding, 44px tap targets.

## Related
- [[wiki/people/scout]] — runs the background checks
- [[wiki/people/kone]] — the human this is built for
- [[wiki/topics/it-sales]] — primary use case context
- [[wiki/topics/shared-ui]] — design system used
