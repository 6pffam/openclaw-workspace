# 📦 REPOSITORY.md — Artifact Index

Every document, report, summary, plan, or artifact produced in this workspace is registered here.
This is the single place to find everything that was ever made.

---

## 📋 How to Read This

- **Date** — when it was created
- **Title** — what it is
- **Path** — where to find it (relative to workspace root)
- **Type** — report / plan / summary / code / config / analysis / identity
- **Description** — one line on what it contains

New entries go at the **top** of the table (newest first).

---

## 🗂️ Identity & Config Changes

Changes to core identity files (AGENTS.md, SOUL.md, USER.md, IDENTITY.md) are tracked here.

- **2026-05-26** — `AGENTS.md` — Added obsessive documentation section (📁 Obsessive Documentation — Core Identity)
- **2026-05-26** — `SOUL.md` — Added documentation obsession as a core truth; updated vibe section
- **2026-05-26** — `AGENTS.md` + `SOUL.md` — Added note: Kone is an aggressive notetaker
- **2026-05-26** — `REPOSITORY.md` — Created this file (artifact index)

---

## 📄 Artifacts

| Date | Title | Path | Type | Description |
|------|-------|------|------|-------------|
| 2026-05-26 | LLM Wiki Implementation Plan | `artifacts/2026-05-26-llm-wiki-implementation-plan.md` | plan | Full phased plan to implement Karpathy LLM Wiki pattern for persistent agent memory |
| 2026-05-26 | Artifact Index | `REPOSITORY.md` | index | This file — registry of all produced artifacts |

_No content artifacts yet. Future reports, summaries, plans, and outputs will appear here._

---

## 🧠 Session Memory Index

Daily memory files live in `memory/`. Key sessions:

- **2026-05-25** → `memory/2026-05-25.md` — Nexus Mission Control dashboard built (Phase 1 + 2)

---

## 🔗 Quick Links

- Workspace root: `/Users/6pf/.openclaw/workspace/`
- Artifacts folder: `artifacts/`
- Daily memory: `memory/YYYY-MM-DD.md`
- Long-term memory: `MEMORY.md`
- Nexus repo: <https://github.com/6pffam/openclaw-nexus>

---

_Last updated: 2026-05-26 by fam6pfbot ⚡_

## 🗂️ Wiki (LLM-Maintained Knowledge Base)

Created 2026-05-26. Lives at `wiki/`. Agent-maintained, Obsidian-compatible.

| Page | Path | Summary |
|------|------|---------|
| Wiki Index | `wiki/index.md` | Master catalog of all wiki pages |
| Wiki Schema | `wiki/schema.md` | Conventions, workflows, ingest/query/lint rules |
| Wiki Log | `wiki/log.md` | Append-only activity log |
| Overview | `wiki/overview.md` | Big-picture synthesis, current focus |
| Project Nexus | `wiki/projects/nexus.md` | Mission Control dashboard — status, backlog, notes |
| Kone | `wiki/people/kone.md` | Owner profile — professional, personal, style |
| IT Sales | `wiki/topics/it-sales.md` | Kone's professional domain |
| Sim Racing | `wiki/topics/sim-racing.md` | Serious hobby, rig in progress |
| Entrepreneurship | `wiki/topics/entrepreneurship.md` | Side business goal |
| LLM Wiki Adoption | `wiki/decisions/2026-05-26-llm-wiki-adoption.md` | Decision record for adopting this pattern |

### Tools
| Tool | Path | Description |
|------|------|-------------|
| Wiki Search | `wiki-search.sh` | grep-based search across all wiki pages |

### Raw Sources
- `raw/` — empty, ready for first source ingest

## 🏗️ Nexus — Phase 4 (Wiki Integration)

Added 2026-05-26.

| File | Description |
|------|-------------|
| `nexus/lib/wiki.ts` | Reads wiki/, parses frontmatter, extracts links, builds graph data |
| `nexus/app/api/wiki/route.ts` | GET /api/wiki — page list or graph data |
| `nexus/app/api/wiki/page/route.ts` | GET /api/wiki/page?slug=... — rendered markdown |
| `nexus/app/wiki/page.tsx` | Wiki viewer — sidebar, reader, graph toggle |
| `nexus/app/wiki/WikiGraph.tsx` | D3 force graph of wiki page connections |

## 🤖 Multi-Agent Crew Buildout

Started: 2026-05-27

| Date | Item | Description |
|------|------|-------------|
| 2026-05-27 | FORGE agent | Coder agent created — workspace, SOUL.md, AGENTS.md, registered in OpenClaw config |
| 2026-05-27 | crew.json | Updated with full planned crew: FORGE (active), SCOUT/SCRIBE/VAULT/EMBER/REVS (planned) |
| 2026-05-27 | Nexus Team screen | Live agent status wired to session data; planned agents styled with dashed border + dimmed |
| 2026-05-27 | Wiki people pages | Created pages for fam6pfbot, FORGE, SCOUT, SCRIBE, VAULT, EMBER, REVS |
| 2026-05-27 | task-forge-001 | FORGE's first task — Add Paused column to Nexus Tasks. Completed, pending approval |
