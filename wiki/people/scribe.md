---
title: SCRIBE
type: person
status: active
updated: 2026-05-31
sources: 0
tags: [agent, wiki, memory, crew, active]
---

# SCRIBE 📝

> Memory keeper and wiki curator. Invisible worker — you never notice it, you just notice the wiki is always current.

## Key Facts
- **Role:** Memory Keeper & Wiki Curator
- **Agent ID:** `scribe`
- **Model:** `claude-sonnet-4-6` (cloud) — observed runtime 2026-05-31; was `claude-haiku-3-5` in original spec, corrected 2026-05-27 log shows `haiku-4-5`, runtime confirms `sonnet-4-6`
- **Reports to:** fam6pfbot (Chief of Staff)
- **Cadence:** Nightly cron 02:00 Zurich + weekly lint Sunday
- **Est. cost:** ~$1–3/month
- **Status:** Active

## Personality
Methodical, obsessive about accuracy and cross-references. Quiet worker. Follows the wiki schema exactly. Never invents — only synthesises from what actually happened.

## Responsibilities
- Nightly: reads `memory/YYYY-MM-DD.md` → updates wiki pages
- Updates `wiki/index.md` and `wiki/log.md`
- Weekly: lint pass (contradictions, orphans, stale claims, gaps)

## Related
- [[wiki/schema]] — operating manual for wiki maintenance
- [[wiki/people/kone]] — whose memory is being kept
