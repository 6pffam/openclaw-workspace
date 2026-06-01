---
title: Adopt LLM Wiki Pattern for Agent Memory
type: decision
status: decided
decided: 2026-05-26
tags: [memory, wiki, architecture]
---

# Decision: Adopt LLM Wiki Pattern for Agent Memory

## Context
The agent's memory consisted of flat daily logs (`memory/YYYY-MM-DD.md`) and a manually-curated `MEMORY.md`. Knowledge had to be rediscovered each session. No cross-references. No compounding.

Karpathy published an LLM Wiki pattern: instead of RAG over raw docs, the LLM maintains a persistent wiki of structured, interlinked pages. Knowledge accumulates rather than being re-derived.

## Options Considered
- **Keep flat files** — simple, low overhead, but knowledge doesn't compound
- **RAG over memory files** — better retrieval but no synthesis, still re-derives every time
- **LLM Wiki pattern** — persistent structured pages, LLM does all maintenance, knowledge compounds ✅

## Decision
Adopt the LLM Wiki pattern. Implement in 3 phases (Phase 4 — Nexus integration — deferred):
- Phase 1: Scaffold wiki, migrate existing memory
- Phase 2: Ingest/Query/Lint workflows in schema
- Phase 3: Search tooling + YAML frontmatter

## Consequences
- `wiki/` becomes the primary memory source at session startup
- `MEMORY.md` deprecated, content migrated
- Agent must maintain wiki pages on every ingest
- Good answers and analyses must be filed back into wiki or artifacts

## Related
- [[wiki/overview]] — updated to reflect wiki as memory backbone
- `artifacts/2026-05-26-llm-wiki-implementation-plan.md` — full implementation plan

## Sources
- Karpathy LLM Wiki gist: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
