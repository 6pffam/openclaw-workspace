---
title: Shared UI Design System
type: topic
status: active
updated: 2026-05-30
tags: [design-system, ui, frontend, typescript, tailwind]
---

# Shared UI Design System (`@openclaw/ui`)

> Single design source of truth for all OpenClaw apps — dark navy theme, shared components, one globals.css.

## Key Facts
- **Package:** `@openclaw/ui`
- **Location:** `workspace/shared-ui/`
- **Shipped:** 2026-05-29
- **Consumers:** Nexus (:3000), Dossier (:3002), Universe (:3001)

## Components
- `Card`
- `Button`
- `Badge`
- `StatusDot`
- `PageHeader`
- `EmptyState`
- `NavBar`
- Master `globals.css` — dark navy theme variables

## Why It Exists
Before 2026-05-29, each app had its own design language:
- Nexus: dark navy (reference design)
- Dossier: white/shadcn (Google Finance aesthetic)
- Universe: cream/Radix UI

After the shared-ui port, all three apps share the same visual identity. shadcn, `@base-ui/react`, and all Radix UI packages were removed from Dossier and Universe. All three apps build clean.

## Rules / Conventions
- Design changes go into `shared-ui/` first, then consume in apps
- Never reintroduce shadcn or Radix UI as a shortcut
- All new apps must start from `@openclaw/ui`

## Open Questions
- Is `shared-ui` published as a local npm package or symlinked via workspace?

## Related
- [[wiki/projects/nexus]] — reference design, primary consumer
- [[wiki/projects/dossier]] — ported 2026-05-29
- [[wiki/projects/universe]] — ported 2026-05-29

## Sources
- `wiki/log.md` — 2026-05-29 session observations (Shared UI Design System shipped)
