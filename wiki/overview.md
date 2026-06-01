---
title: Overview
type: meta
updated: 2026-05-30
---

# Overview — The Big Picture

> A synthesis of everything in this wiki. The starting point for any session.

---

## Who We Are

**Kone** is an enterprise IT sales professional based in Zurich, a serious sim racer, and someone building toward entrepreneurship. He works with a personal AI agent (fam6pfbot ⚡) that lives in this OpenClaw workspace.

**fam6pfbot** is the Chief of Staff agent — sharp, low-latency, documentation-obsessed. Exists across sessions through these files.

**Full Crew (8 agents total):**
- **Active:** fam6pfbot (Chief of Staff), FORGE (coder), SCOUT (sales intel), SCRIBE (wiki curator), VAULT (private finance), EMBER (entrepreneur scout), REVS (motorbike researcher)
- Each agent has dedicated responsibilities and reporting schedule

---

## Active Projects

- **[[wiki/projects/nexus]]** — Mission Control dashboard. Next.js 15 / Tailwind v4. Features: team roster (live status), office view, tasks (Kanban + approval flow), projects, WBS planning, memory viewer, wiki reader, calendar widget, mobile PWA, Tailscale remote access. Runs at `:3000`.
- **[[wiki/projects/dossier]]** — Background check dashboard. SCOUT-powered research briefs. SQLite, queue-based trigger, results viewer. Runs at `:3002`.
- **[[wiki/projects/universe]]** — Private data app. Auth/session layer, DB-backed, cron digest. Purpose TBD. Runs at `:3001`.

All three apps share the `@openclaw/ui` dark navy design system (`workspace/shared-ui/`). Mobile responsive with bottom tab nav and PWA support.

---

## Key Topics

- **[[wiki/topics/it-sales]]** — Kone's profession. Enterprise hardware (compute/network/storage), large global clients, commercial frameworks.
- **[[wiki/topics/sim-racing]]** — Serious hobby. High-end rig in progress. Details TBD.
- **[[wiki/topics/entrepreneurship]]** — Kone's goal. Side business that genuinely excites him. Direction TBD.

---

## Current Focus (as of 2026-05-30)

1. **Crew coordination** — 8 agents live and reporting. Nightly wiki sync via SCRIBE running.
2. **Cost tracking** — Multi-agent cost breakdown in Nexus in progress. Real usage data in `.jsonl` session files (not `.trajectory.jsonl`).
3. **SCOUT model audit** — Discrepancy between configured model (haiku-4-5) and observed session model (sonnet-4-6) needs investigation.
4. **Entrepreneurship direction** — EMBER researching opportunities weekly (Mondays 08:00 Zurich).

---

## New Systems

- **active-work/** folder — WBS plans for ongoing projects. Auto-loaded at session start via AGENTS.md.
- **SCRIBE agent** — nightly (02:00 Zurich) ingests `memory/YYYY-MM-DD.md` and updates wiki.
- **Wiki graph** — visual map of knowledge, accessible in Nexus under WIKI tab.

---

## How to Use This Wiki

- **Exploring a project?** → `wiki/projects/`
- **Remembering something about Kone?** → `wiki/people/kone.md`
- **Deep-diving a topic?** → `wiki/topics/`
- **What just happened?** → `wiki/log.md`
- **Find anything fast?** → `wiki/index.md` or `./wiki-search.sh <query>`
