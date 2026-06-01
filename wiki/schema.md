---
title: Wiki Schema
type: meta
updated: 2026-05-26
---

# Wiki Schema — Conventions & Workflows

This document defines how the wiki is structured and how the agent operates on it.
It is the agent's operating manual for all wiki-related tasks.

---

## Directory Structure

```
wiki/
├── schema.md          ← This file. Conventions and workflows.
├── index.md           ← Master catalog of all pages (content-oriented)
├── log.md             ← Append-only chronological activity log
├── overview.md        ← High-level synthesis — the "big picture"
├── projects/          ← One page per project
├── people/            ← Kone, contacts, collaborators
├── topics/            ← Subject-matter knowledge pages
└── decisions/         ← Key decisions and their rationale

raw/                   ← Immutable source documents (never edited)
```

---

## Page Format

Every wiki page uses this template:

```markdown
---
title: <Title>
type: project | person | topic | decision | summary | meta
status: active | archived | draft
updated: YYYY-MM-DD
sources: <count>
tags: [tag1, tag2]
---

# Title

> One-sentence synthesis — the "so what."

## Key Facts
- Bullet points of the most critical things to know

## Details
Longer-form content, sub-sections as needed.

## Open Questions
- What we don't know yet, what needs follow-up

## Related
- [[wiki/projects/example]] — description
- [[wiki/people/example]] — description

## Sources
- `raw/YYYY-MM-DD-slug.md` — description
- `memory/YYYY-MM-DD.md` — description
```

---

## Ingest Workflow

When a new source arrives (URL, doc, session log, note):

1. Save to `raw/YYYY-MM-DD-<slug>.md` (immutable from here on)
2. Read the source; discuss key takeaways if needed
3. Write or update a summary/entity page in the wiki
4. Update `wiki/index.md` — add new page, update source counts
5. Touch all relevant entity/concept pages (expect 5-15 pages per source)
6. Append to `wiki/log.md`:
   ```
   ## [YYYY-MM-DD] ingest | Source Title
   - Pages created: ...
   - Pages updated: ...
   ```

Daily memory files (`memory/YYYY-MM-DD.md`) are ingested periodically (weekly or on demand).

---

## Query Workflow

When answering a question using the wiki:

1. Read `wiki/index.md` — find relevant pages
2. Read those pages
3. Synthesize answer with page citations (e.g. `→ wiki/projects/nexus.md`)
4. If the answer is a valuable analysis, comparison, or decision → **file it back**:
   - High-value answers → new wiki page in appropriate category
   - Reports/summaries → `artifacts/YYYY-MM-DD-slug.md` + register in `REPOSITORY.md`

---

## Lint Workflow

Periodic health-check (run weekly or on request):

1. Scan all pages for **contradictions** with other pages
2. Find **stale claims** superseded by newer sources
3. Identify **orphan pages** (no inbound links from other pages)
4. Flag **missing pages** — concepts mentioned but not having their own page
5. Check for **missing cross-references**
6. Suggest **gaps** — questions to investigate, sources to find
7. Log the lint pass: `## [YYYY-MM-DD] lint | N issues found`

---

## Session Startup

At session start, the agent should:
1. Read `wiki/index.md` — get the map of all knowledge
2. Read last 10 entries of `wiki/log.md` — what happened recently
3. Load specific pages relevant to current context

This replaces reading flat `MEMORY.md`.

---

## Naming Conventions

- Filenames: lowercase, hyphens, no spaces (`sim-racing.md`, `project-nexus.md`)
- Log entries: `## [YYYY-MM-DD] <action> | <title>`
- Dates: always ISO 8601 (YYYY-MM-DD)
- Links: use relative paths `[[wiki/projects/nexus]]` or `[text](../projects/nexus.md)`

---

## Rules

- **Raw sources are immutable.** Never edit files in `raw/`.
- **The wiki is LLM-owned.** The agent writes and maintains all pages. Kone reads.
- **File it or lose it.** Any valuable output (analysis, answer, plan) gets saved.
- **Log everything.** Every ingest, query result, lint pass goes in `log.md`.
- **Update index.md on every change.** The index is always current.

---

## Ingest — Daily Memory Files

At the end of each session (or during heartbeats), process `memory/YYYY-MM-DD.md`:

1. Read the daily log
2. Identify: new projects, decisions made, things learned, changes to existing pages
3. Update relevant wiki pages
4. Update `wiki/index.md` if new pages created
5. Append to `wiki/log.md`: `## [YYYY-MM-DD] ingest | memory/YYYY-MM-DD.md`

---

## Ingest — External Sources

When Kone shares a URL, doc, or note:

1. Fetch/save to `raw/YYYY-MM-DD-<slug>.<ext>`
2. Read and discuss with Kone if appropriate
3. Create summary page: `wiki/<category>/YYYY-MM-DD-<slug>.md`
4. Update all touched entity/topic pages
5. Update index + log

---

## Decision Log Format

When a significant decision is made, file it:

```markdown
---
title: <Decision Title>
type: decision
status: decided | under-review | reversed
decided: YYYY-MM-DD
tags: [relevant, tags]
---

# Decision: <Title>

## Context
What situation prompted this decision.

## Options Considered
- Option A — pros/cons
- Option B — pros/cons

## Decision
What was decided and why.

## Consequences
What this means going forward.

## Related
- [[relevant pages]]
```
