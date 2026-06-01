---
title: Adopt @openclaw/ui as Shared Design System
type: decision
status: decided
decided: 2026-05-29
tags: [frontend, ui, design-system, architecture]
---

# Decision: Adopt `@openclaw/ui` as Shared Design System

## Context
By 2026-05-29, three apps existed in the workspace — Nexus (:3000), Dossier (:3002), Universe (:3001) — each with distinct design languages:
- Nexus: dark navy (the reference design)
- Dossier: white/shadcn (Google Finance aesthetic)
- Universe: cream/Radix UI

Maintaining three separate design stacks created inconsistency and maintenance overhead. Dossier and Universe were visually out of sync with Nexus.

## Options Considered
- **Option A: Keep per-app design stacks** — low migration effort, persistent inconsistency, growing divergence over time
- **Option B: Standardise on Nexus navy + extract shared package** — migration effort upfront, single source of truth, all apps visually unified

## Decision
Chose Option B. Created `workspace/shared-ui/` as a local package (`@openclaw/ui`) exporting shared components and a master `globals.css`. Removed shadcn, `@base-ui/react`, and all Radix UI packages from Dossier and Universe. Ported both apps to dark navy.

## Consequences
- All three apps now share the same visual identity
- New apps must start from `@openclaw/ui` — no per-app reinvention
- shadcn and Radix UI are banned as shortcuts going forward
- Design changes flow: `shared-ui/` first → consume in apps
- All three apps build clean post-migration

## Related
- [[wiki/topics/shared-ui]] — the design system itself
- [[wiki/projects/nexus]] — reference design
- [[wiki/projects/dossier]] — ported 2026-05-29
- [[wiki/projects/universe]] — ported 2026-05-29
