---
title: Project Universe
type: project
status: active
updated: 2026-05-30
tags: [nextjs, dashboard, openclaw, typescript, shared-ui]
---

# Project Universe

> Private data application — personal app with auth/session layer, DB-backed, and scheduled digest output.

## Key Facts
- **Location:** `/Users/6pf/.openclaw/workspace/universe` (inferred)
- **Stack:** Next.js (App Router), Tailwind, `@openclaw/ui` (shared-ui)
- **Runs on:** localhost:3001 (Tailscale: http://100.64.128.24:3001)
- **Service:** LaunchAgent (assumed, consistent with Nexus/Dossier pattern)

## What We Know
- Has session-based authentication (login/unlock flow)
- DB that stays open in-process after first login (no re-unlock until server restart)
- Middleware (`proxy.ts`) with X-Cron-Secret bypass for scheduled calls
- Cron digest script: `send-digest.sh` — sends digest output on schedule
- Fully ported to dark navy `@openclaw/ui` design system as of 2026-05-29 (was cream/Radix UI)
- All Radix UI packages removed
- Mobile responsive: bottom tab nav, safe-area insets, 44px tap targets (as of 2026-05-29)

## Open Questions
- What is Universe's primary purpose? (private finance, personal data, encrypted vault?)
- Does VAULT agent interface with Universe directly?
- What does `send-digest.sh` deliver and to where?

## Related
- [[wiki/people/vault]] — possible primary agent interface
- [[wiki/people/kone]] — the human this is built for
- [[wiki/topics/shared-ui]] — design system used
- [[wiki/projects/nexus]] — sibling app (:3000)
- [[wiki/projects/dossier]] — sibling app (:3002)

## Sources
- `wiki/log.md` — 2026-05-27 fix entry (Universe cron digest middleware bypass)
- `wiki/log.md` — 2026-05-29 session observations (shared-ui port, mobile responsive)
