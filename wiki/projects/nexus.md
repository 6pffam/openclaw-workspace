---
title: Project Nexus
type: project
status: active
updated: 2026-05-29
sources: 4
tags: [nextjs, dashboard, openclaw, typescript, tailwind]
---

# Project Nexus

> Mission Control dashboard for the OpenClaw workspace — a real-time HQ showing agents, projects, tasks, and office layout.

## Key Facts
- **Repo:** https://github.com/6pffam/openclaw-nexus
- **Location:** `/Users/6pf/.openclaw/workspace/nexus`
- **Stack:** Next.js 15 (App Router), Tailwind v4, TypeScript
- **Runs on:** localhost:3000
- **Git push:** requires `git push --force --no-verify origin main`

## Completed Screens
- **TODAY** — home/morning briefing: greeting, crew status, pending approvals, agent digests, memory headline, calendar widget. Default home page.
- **Team** — crew roster with live agent status + `lastActiveAt` per agent ("X min ago")
- **Visual Office** — pixel-art floor plan, glowing desks for active agents
- **Projects** — workspace scanner, project cards with WBS button / Create Plan modal
- **Tasks** — Kanban board (5 columns incl. Rejected); Approve + Reject buttons with git revert on rejection
- **WBS** — `/wbs/[slug]` visual phase tracker with live SSE, WBS markdown parser, plan approval flow
- **Memory** — `/memory` tab, date list sidebar + full content reader, mobile date dropdown
- **Wiki** — wiki reader with sidebar, markdown renderer, D3 force-graph view

## Infrastructure
- Real-time SSE filesystem watcher (`app/api/watch/route.ts`) — pure push, no polling
- Live agent status reads from OpenClaw session files; `lastActiveAt` from per-agent session directories
- Tasks persist to `nexus/data/tasks.json`
- Crew data in `nexus/data/crew.json` (8 members)
- **LaunchAgent:** `~/Library/LaunchAgents/ai.openclaw.nexus.plist` — auto-start + KeepAlive on crash/reboot
- **Tailscale:** accessible from anywhere at `http://100.64.128.24:3000`
- **PWA:** installable on iPhone via Safari → Add to Home Screen; bottom nav on mobile
- **Cost tracking** — in progress; multi-agent cost breakdown by month (reading session usage data)

## Key Files
- `lib/workspace.ts` — reads crew + session data
- `lib/projects.ts` — scans workspace for projects
- `lib/tasks.ts` — reads task data
- `hooks/useRealtimeUpdates.ts` — SSE client hook
- `components/nav/NavBar.tsx` — pill tab bar
- `components/team/CrewCard.tsx` — crew member card

## Next Steps (Backlog)
1. **Cost tracking** — finish multi-agent cost breakdown (usage data in `.jsonl` not `.trajectory.jsonl`; OpenClaw usage-cost-cache only covers `main` agent)
2. Further Dossier integration if needed

## Known Issues / Notes
- Tailwind v4: no `tailwind.config.ts` — theme lives in `globals.css` via `@theme {}`
- Next.js 15: params is async — `const { id } = await params`
- Copy-paste via Telegram mangles JSX — always do full file replacements, never partial edits
- Cost tracking: `.trajectory.jsonl` files have empty `usage {}` — real usage data lives in `.jsonl` session files
- SCOUT uses `claude-sonnet-4-6` (expensive) and has accumulated 67+ sessions

## Open Questions
- Cost tracking: confirm correct source for per-agent token usage across all 8 crew members

## Related
- [[wiki/people/kone]] — the human this is built for
- [[wiki/topics/it-sales]] — work context that feeds the team/projects screens

## Sources
- `memory/2026-05-25.md` — full Nexus build session log
- `artifacts/2026-05-26-llm-wiki-implementation-plan.md` — Phase 4 wiki integration plan
