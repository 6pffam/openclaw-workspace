---
title: Wiki Index
type: meta
updated: 2026-05-31
---

# Wiki Index — Master Catalog

Every page in the wiki. Read this first. Updated on every ingest or change.

---

## 📋 Meta

| Page | Summary |
|------|---------|
| [overview.md](overview.md) | High-level synthesis — the big picture, current focus |
| [schema.md](schema.md) | Conventions, workflows, page format, rules |
| [log.md](log.md) | Append-only chronological activity log |
| [index.md](index.md) | This file — master catalog |

---

## 🏗️ Projects

| Page | Status | Summary |
|------|--------|---------|
| [projects/nexus.md](projects/nexus.md) | active | Mission Control dashboard — Next.js 15, real-time SSE, full crew UI, WBS, Memory, Wiki, PWA, Tailscale. Cost tracking in progress. |
| [projects/dossier.md](projects/dossier.md) | active | Background check dashboard — Next.js, SQLite, queue-based SCOUT trigger. Ported to navy @openclaw/ui. |
| [projects/universe.md](projects/universe.md) | active | Private data app — auth/session layer, DB-backed, cron digest. Ported to navy @openclaw/ui. Purpose TBD. |

---

## 👤 People

| Page | Summary |
|------|---------|
| [people/kone.md](people/kone.md) | Kone — owner, IT sales, sim racer, Zurich, entrepreneur-in-progress |
| [people/fam6pfbot.md](people/fam6pfbot.md) | fam6pfbot — Chief of Staff, main agent, crew coordinator |
| [people/forge.md](people/forge.md) | FORGE — coder agent, live, claude-sonnet-4-6 |
| [people/scout.md](people/scout.md) | SCOUT — sales intel analyst, on-demand ✅ |
| [people/scribe.md](people/scribe.md) | SCRIBE — wiki curator, nightly cron 02:00 ✅ |
| [people/vault.md](people/vault.md) | VAULT — private finance, local Ollama ✅ |
| [people/ember.md](people/ember.md) | EMBER — entrepreneur scout, weekly Monday 08:00 ✅ |
| [people/revs.md](people/revs.md) | REVS — motorbike researcher, weekly Friday 17:00 ✅ |

---

## 📚 Topics

| Page | Summary |
|------|---------|
| [topics/it-sales.md](topics/it-sales.md) | Kone's profession — enterprise hardware, large clients, commercial frameworks |
| [topics/sim-racing.md](topics/sim-racing.md) | Kone's serious hobby — high-end rig in progress |
| [topics/entrepreneurship.md](topics/entrepreneurship.md) | Kone's goal — side business that genuinely excites him |
| [topics/shared-ui.md](topics/shared-ui.md) | `@openclaw/ui` — dark navy design system shared across Nexus, Dossier, Universe |

---

## 📝 Decisions

| Page | Status | Summary |
|------|--------|---------|
| [decisions/shared-ui-design-system.md](decisions/shared-ui-design-system.md) | decided | Adopt `@openclaw/ui` as the single shared design system; removed shadcn + Radix from Dossier and Universe |
| [decisions/scout-queue-trigger.md](decisions/scout-queue-trigger.md) | decided | Queue-file pattern for SCOUT trigger in Dossier — decoupled async research, no direct gateway call from API |

---

## Stats
- **Total pages:** 15
- **Projects:** 3
- **People:** 8
- **Topics:** 4
- **Decisions:** 2
- **Last updated:** 2026-05-31
