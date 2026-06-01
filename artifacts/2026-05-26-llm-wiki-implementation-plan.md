# LLM Wiki — Implementation Plan
**Based on:** Karpathy's LLM Wiki gist  
**Date:** 2026-05-26  
**Goal:** Replace flat memory files with a persistent, compounding, interlinked knowledge base that the agent maintains — so knowledge accumulates instead of being rediscovered session by session.

---

## The Problem We're Solving

Right now, memory works like this:
- Daily logs in `memory/YYYY-MM-DD.md` — raw, unstructured, hard to query
- `MEMORY.md` — manually curated, tends to go stale, no cross-references
- Every session, I rediscover context from scratch by skimming files

The LLM Wiki pattern fixes this: instead of raw logs, there's a **living wiki** of structured pages — entity pages, topic pages, project pages — that I maintain and update as new information arrives. Knowledge compounds.

---

## Architecture (Our Specific Setup)

```
/Users/6pf/.openclaw/workspace/
├── wiki/                        ← The wiki (LLM-owned, LLM-maintained)
│   ├── index.md                 ← Master catalog of all wiki pages
│   ├── log.md                   ← Append-only chronological log
│   ├── schema.md                ← Conventions, page formats, workflows
│   ├── overview.md              ← High-level synthesis — the "big picture"
│   ├── projects/                ← One page per project
│   │   └── nexus.md
│   ├── people/                  ← Kone, contacts, collaborators
│   │   └── kone.md
│   ├── topics/                  ← Subject-matter pages
│   │   └── sim-racing.md
│   │   └── it-sales.md
│   │   └── entrepreneurship.md
│   └── decisions/               ← Key decisions and their rationale
│       └── ...
├── raw/                         ← Immutable source documents
│   └── YYYY-MM-DD-<slug>.md     ← Articles, notes, transcripts Kone shares
├── memory/                      ← Daily session logs (unchanged, feeds ingest)
├── artifacts/                   ← Reports, outputs (unchanged)
├── REPOSITORY.md                ← Artifact index (unchanged)
└── MEMORY.md                    ← Deprecated once wiki is mature; redirect to wiki/
```

**Three layers:**
1. **Raw sources** (`raw/`) — immutable. Articles, notes, session logs, links. Never edited.
2. **Wiki** (`wiki/`) — LLM-owned. Structured, interlinked markdown. Always being updated.
3. **Schema** (`wiki/schema.md`) — conventions the agent follows. Co-evolved over time.

---

## Phases

---

### Phase 1 — Foundation
**Goal:** Scaffold the wiki structure and migrate existing knowledge.

**Tasks:**
1. Create `wiki/` directory with subdirs: `projects/`, `people/`, `topics/`, `decisions/`
2. Create `wiki/schema.md` — page format conventions, ingest workflow, naming rules
3. Create `wiki/index.md` — initial catalog (can be sparse)
4. Create `wiki/log.md` — append-only log, starting with this session
5. Create `wiki/overview.md` — high-level synthesis of what we know so far
6. Migrate `MEMORY.md` content into proper wiki pages:
   - Nexus project → `wiki/projects/nexus.md`
   - Kone profile → `wiki/people/kone.md`
   - Topics (sim racing, IT sales, etc.) → `wiki/topics/`
7. Update `AGENTS.md` to point agents at `wiki/` as the primary memory source
8. Create `raw/` directory

**Output:** A working wiki with ~10 seed pages. `MEMORY.md` becomes a pointer: "See wiki/."

---

### Phase 2 — Core Workflows
**Goal:** Establish repeatable processes for Ingest, Query, and Lint.

#### Ingest workflow
When Kone shares a document, article, URL, or note:
1. Save it to `raw/YYYY-MM-DD-<slug>.md` (or `.txt`, etc.)
2. Read it, discuss key takeaways
3. Write/update a summary page in the wiki
4. Update `wiki/index.md`
5. Touch all relevant entity/concept pages (a single source can update 5-15 pages)
6. Append to `wiki/log.md`: `## [2026-05-26] ingest | Article Title`

Daily memory files (`memory/YYYY-MM-DD.md`) are a special ingest source — processed periodically to update project/topic/decision pages.

#### Query workflow
When asked a question:
1. Read `wiki/index.md` to find relevant pages
2. Read those pages
3. Synthesize answer with page citations
4. If the answer is valuable (analysis, comparison, decision) → **file it back** as a new wiki page or `artifacts/` entry. Good answers compound.

#### Lint workflow (periodic — e.g. weekly heartbeat)
Ask the agent to health-check the wiki:
- Contradictions between pages?
- Stale claims superseded by newer info?
- Orphan pages with no inbound links?
- Important concepts mentioned but lacking a page?
- Missing cross-references?
- Data gaps that need a web search?
Log the lint pass in `wiki/log.md`.

---

### Phase 3 — Tooling
**Goal:** Make the wiki queryable at scale.

**3a — Search script (immediate)**
A simple shell script wrapping `ripgrep` for the wiki:
```bash
# wiki-search.sh <query>
rg -l "$1" wiki/ | head -20
```
Fast, zero infrastructure. Good enough for <200 pages.

**3b — qmd (when wiki grows)**
[qmd](https://github.com/tobi/qmd) — local BM25/vector hybrid search for markdown, with CLI + MCP server. Install when the wiki has 100+ pages and keyword search starts missing things.

**3c — Obsidian compatibility**
The wiki is just markdown files. Drop Obsidian on top for:
- Graph view (visual map of what's connected)
- Backlinks panel
- Dataview queries over YAML frontmatter
- Marp slides from wiki content

This is zero-cost — just point Obsidian at `wiki/`. No migration needed.

**3d — YAML frontmatter on wiki pages**
Add frontmatter to all wiki pages for Dataview:
```yaml
---
title: Project Nexus
type: project
status: active
updated: 2026-05-26
sources: 3
tags: [nextjs, dashboard, openclaw]
---
```

---

### Phase 4 — Nexus Integration
**Goal:** Browse and interact with the wiki from the Nexus Mission Control dashboard.

**4a — Wiki viewer tab**
New "Knowledge" tab in Nexus:
- Lists all wiki pages from `wiki/index.md`
- Click → renders the markdown page
- Search bar (calls the search script via API)

**4b — Ingest UI**
From the Nexus Tasks panel, a "Feed knowledge" button:
- Paste a URL or drop a file
- Kicks off the ingest workflow in the background

**4c — Graph view**
Parse `[[wiki links]]` in pages, render as a D3 force graph showing how pages connect. Orphan detection becomes visual.

---

## Page Format Standard

Every wiki page follows this template:

```markdown
---
title: <Title>
type: project | person | topic | decision | summary
status: active | archived | draft
updated: YYYY-MM-DD
sources: <count of raw sources that feed this page>
tags: [tag1, tag2]
---

# Title

One-paragraph synthesis — the "so what."

## Key Facts
- Bullet points of the most important things to know

## Details
Longer-form content, sub-sections as needed.

## Open Questions
- What we don't know yet

## Related
- [[link to other wiki page]]
- [[link to other wiki page]]

## Sources
- `raw/YYYY-MM-DD-slug.md` — description
```

---

## Migration Plan (MEMORY.md → Wiki)

`MEMORY.md` currently has ~everything in one flat file. Migration steps:

1. Read current `MEMORY.md`
2. Extract entities: Kone (person), Nexus (project), sim racing (topic), IT sales (topic), entrepreneurship (topic)
3. Create one wiki page per entity — richer, structured, with cross-links
4. Replace `MEMORY.md` body with: `See wiki/ — this file is deprecated.`
5. Update `AGENTS.md` startup instructions: load `wiki/index.md` at session start instead of `MEMORY.md`

---

## Session Startup (Updated)

After wiki is built, the new startup sequence:
1. Read `wiki/index.md` — get the map of everything
2. Read `wiki/log.md` (last 10 entries) — what happened recently
3. Read specific pages relevant to today's context (projects, people)

This is faster and richer than reading flat `MEMORY.md`.

---

## Prioritized Execution Order

| Phase | Task | Effort | Value |
|-------|------|--------|-------|
| 1 | Scaffold wiki structure | Low | High |
| 1 | Write schema.md | Low | High |
| 1 | Migrate MEMORY.md to wiki pages | Medium | High |
| 2 | Ingest workflow in AGENTS.md | Low | High |
| 2 | Query workflow | Low | Medium |
| 3a | Search script | Low | Medium |
| 3c | Obsidian on wiki/ | Zero | Medium |
| 2 | Lint workflow | Low | Medium |
| 3b | qmd (when needed) | Medium | Medium |
| 3d | YAML frontmatter | Low | Low-Medium |
| 4a | Nexus wiki viewer | High | High |
| 4b | Nexus ingest UI | Medium | Medium |
| 4c | Nexus graph view | High | High |

**Recommendation: Start with Phase 1 + 2 in the next session. It's ~1-2 hours of work and immediately improves memory quality.**

---

## What Changes for You (Kone)

- You can ask "what do we know about X?" and get a structured wiki page, not a grepped log
- You can drop a link or document and say "ingest this" — it gets folded into the knowledge base
- Every analysis or answer worth keeping gets filed back, so nothing disappears into chat history
- The wiki grows richer over time automatically — not because you maintain it, but because I do

---

_Artifact saved: `artifacts/2026-05-26-llm-wiki-implementation-plan.md`_  
_Registered in: `REPOSITORY.md`_
