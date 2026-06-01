---
title: Wiki Log
type: meta
updated: 2026-05-26
---

# Wiki Log — Append-Only Activity Record

Chronological record of all wiki activity. Never edit past entries.
Parse with: `grep "^## \[" wiki/log.md | tail -10`

---

## [2026-05-26] init | Wiki initialized
- Wiki scaffolded from Karpathy LLM Wiki pattern
- Directories created: projects/, people/, topics/, decisions/
- Files created: schema.md, index.md, log.md, overview.md
- Seed pages created: projects/nexus.md, people/kone.md, topics/sim-racing.md, topics/it-sales.md, topics/entrepreneurship.md
- Source: memory/2026-05-25.md, USER.md, AGENTS.md session context

## [2026-05-26] build | Phase 4 — Nexus wiki integration
- Added WIKI tab to NavBar
- Built lib/wiki.ts — scans wiki/, parses frontmatter, extracts [[links]], graph data
- Built /api/wiki — returns all pages or graph data (?view=graph)
- Built /api/wiki/page — returns rendered HTML for a given slug
- Built app/wiki/page.tsx — wiki reader with sidebar, markdown renderer, view toggle
- Built app/wiki/WikiGraph.tsx — D3 force-directed graph of page connections
- Added wiki-content CSS styles to globals.css
- Fixed 2 pre-existing TS errors (async params, Task type)
- Build: clean ✅

## [2026-05-26] build | Approval flow — git-backed Approve/Reject
- Added 'rejected' status and gitSha/revertStatus fields to Task type
- PATCH /api/tasks now captures git SHA when task moves to pending-approval
- New POST /api/tasks/reject — runs git revert <sha>, handles conflicts, notifies Telegram
- Updated /api/tasks/notify — includes SHA in approval message
- Tasks UI: Approve (green) + Reject (purple) buttons on Needs Approval cards
- Rejected column added (5th column)
- Revert outcome shown as badge on rejected cards (auto-reverted / conflict warning)

## [2026-05-27] build | Multi-agent crew — FORGE + Team screen updates
- FORGE agent created and registered (agentId: forge, model: claude-sonnet-4-6)
- crew.json updated: full 8-member crew (2 active, 5 planned + CEO)
- Nexus Team screen: live status wired to session data via enrichCrewWithLiveStatus()
- Nexus Team screen: planned agents styled with dashed border, dimmed opacity, no status dot
- Wiki people pages created: fam6pfbot, forge, scout, scribe, vault, ember, revs
- Wiki index updated: 8 people pages

## [2026-05-27] build | Active-work WBS system + Nexus integration
- Created `active-work/` folder in workspace — one .md file per project
- Created `active-work/build-crew-agents.md` — WBS for current crew-building work
- Updated AGENTS.md — startup rule: always check active-work/ and auto-resume
- Built `lib/wbs.ts` — markdown WBS parser (phases, tasks, progress)
- Built API routes: /api/wbs, /api/wbs/[slug], /api/wbs/plan, /api/wbs/approve
- Built /wbs/[slug] page — visual phase tracker with live SSE updates
- Updated /projects page — WBS button (when file exists) or Create Plan button (modal)
- Create Plan modal — optional goal input, triggers Telegram notification to agent
- Approve & Start button — writes approval marker + notifies Telegram
- Excluded active-work/ from project scanner (no ghost card)
- Build: clean ✅ — 23 routes total

## [2026-05-27] milestone | Multi-Agent Deployment — COMPLETE
- All 5 agents live and validated: SCOUT, SCRIBE, VAULT, EMBER, REVS
- SCOUT: claude-haiku-4-5, on-demand, sales intel ✅
- SCRIBE: claude-haiku-4-5, nightly cron 02:00 Zurich ✅
- VAULT: ollama/qwen2.5:7b, fully local, on-demand ✅
- EMBER: claude-sonnet-4-6, weekly Monday 08:00 Zurich ✅
- REVS: claude-haiku-4-5, weekly Friday 17:00 Zurich ✅
- Model fix: claude-haiku-3-5 → claude-haiku-4-5 (correct name)
- Vault auth fix: ollama-local key added to main agent auth-profiles.json
- WBS system built and live in Nexus
- Project archived to artifacts/2026-05-27-multi-agent-deployment-completed.md

## [2026-05-27] build | Nexus Polish — COMPLETE
- LaunchAgent: ~/Library/LaunchAgents/ai.openclaw.nexus.plist — auto-start + auto-restart on crash/reboot
- Team screen: lastActiveAt per agent from session files ("X min ago" / "Xh ago" / "Xd ago")
- Memory viewer: /memory tab — date list sidebar + full content reader, auto-selects most recent
- NavBar: added MEMORY tab between TASKS and WIKI
- Build: clean (25 routes)
- All routes 200, LaunchAgent PID confirmed

## [2026-05-27] build | Morning Briefing + Mobile — COMPLETE
- /today page: greeting, crew status, pending approvals, EMBER/REVS digests, memory headline, calendar widget
- /api/today: aggregates tasks, crew status, latest agent artifacts, memory headline
- /api/today/calendar: gog-backed calendar feed (shows "not configured" until gog auth add runs)
- /today is now the default home page (replaces /team redirect)
- TODAY tab added to NavBar (first position)
- PWA: manifest.json, ⚡ icons (192/512/apple-touch), meta tags in layout.tsx
- Bottom nav: mobile-only bottom tab bar (TODAY/TEAM/TASKS/PROJECTS/MEMORY)
- Top nav hidden on mobile (< 768px), bottom nav shown
- Tasks: horizontal scroll with snap on mobile
- Memory: date dropdown replaces sidebar on mobile
- Safe area insets for iPhone notch/home indicator
- Build: clean (28 routes)

## [2026-05-27] setup | Tailscale Remote Access — COMPLETE
- Tailscale installed via Mac App Store on Mac mini
- Mac mini Tailscale IP: 100.64.128.24
- iPhone connected (100.123.127.4, Frankfurt relay)
- Nexus accessible from anywhere: http://100.64.128.24:3000
- OpenClaw dashboard accessible from anywhere: http://100.64.128.24:18789
- PWA installable: open http://100.64.128.24:3000 in Safari on iPhone → Add to Home Screen

## [2026-05-27] fix | Universe — cron digest middleware bypass
- proxy.ts updated to allow X-Cron-Secret header through middleware without session
- send-digest.sh now works when Universe is running and logged in
- DB remains open in global process state after first login (no re-unlock needed until server restart)

## [2026-05-29] ingest | session observations (no memory/2026-05-29.md)
- **No memory file found** for 2026-05-29 — ingested from live session observations instead
- **Dossier queue trigger (FORGE, ~2026-05-28):** gateway code removed from `run/route.ts`; case JSON now written to `dossier/cases/queue/<id>-v<N>.json` for SCOUT heartbeat pickup. `status/route.ts` auto-heal added (running + results file exists → flip to ready).
- **Nexus cost tracking (main agent, ongoing):** multi-agent cost breakdown feature being built; discovered `.trajectory.jsonl` usage is empty — real usage in `.jsonl` session files. SCOUT has 67+ sessions on `claude-sonnet-4-6` (expensive).
- **Pages updated:** projects/dossier.md, projects/nexus.md, index.md

## [2026-05-30] ingest | memory/2026-05-30.md
- **No memory file found** for 2026-05-30 — no sessions today yet
- **Reconciliation pass:** actioned outstanding wiki debt from 2026-05-29 session observations
- **projects/dossier.md updated:** removed shadcn/ui from stack, removed Google Finance visual direction, reflects navy @openclaw/ui port
- **projects/universe.md created:** stub page for Universe app (:3001) — confirmed facts from log entries
- **topics/shared-ui.md created:** @openclaw/ui design system — components, purpose, consumers, history
- **people/scout.md updated:** added open question about model discrepancy (wiki: haiku-4-5 vs observed: sonnet-4-6)
- **overview.md updated:** added Dossier + Universe as active projects; updated current focus section
- **index.md updated:** new pages added, stats updated (9 → 13 pages)
- Pages created: 2 (universe.md, shared-ui.md)
- Pages updated: 5 (dossier.md, scout.md, overview.md, index.md, log.md)

## [2026-05-31] ingest | no memory file
- **No memory/2026-05-31.md found** — no sessions recorded for today
- No wiki updates from memory ingest

## [2026-06-01] ingest | no memory file
- **No memory/2026-06-01.md found** — no sessions recorded for today
- No wiki updates from memory ingest

## [2026-05-31] lint | 6 issues found, 5 fixed
- **Issue 1 (FIXED) — Stale status:** `people/scribe.md` had status `Planned` and tag `planned` — SCRIBE has been live since 2026-05-27. Updated to `Active`.
- **Issue 2 (FIXED) — Wrong model:** `people/scribe.md` model was `claude-haiku-3-5`; runtime confirms `claude-sonnet-4-6`. Updated with observation note.
- **Issue 3 (FIXED) — Stale open question:** `people/vault.md` said "Ollama install approved — pending build" while status was already `Active`. Replaced with current open question about VAULT/Universe integration.
- **Issue 4 (FIXED) — Missing cross-reference:** `topics/it-sales.md` had no link to SCOUT. Added.
- **Issue 5 (FIXED) — Missing cross-reference:** `topics/entrepreneurship.md` had no link to EMBER. Added.
- **Issue 6 (FIXED) — Missing cross-references:** `people/forge.md` only linked Nexus, missing Dossier + Universe. Added.
- **Bonus — First decisions filed:** `decisions/shared-ui-design-system.md` + `decisions/scout-queue-trigger.md` created. Index updated: 13 → 15 pages, decisions: 0 → 2.
- **Open (unresolved) — SCOUT model discrepancy:** configured `haiku-4-5` vs 67+ sessions observed on `sonnet-4-6`. Requires investigation by Kone or main agent.
- **Crew Activation:** SCOUT, SCRIBE, VAULT, EMBER, REVS all marked as active (status: active, tags updated)
- **Model Corrections:** SCOUT & REVS updated to claude-haiku-4-5 (was claude-haiku-3-5)
- **System Updates:** Overview.md refreshed with crew roster, WBS system, and current focus areas
- **Index:** Updated agent summaries with cadence details and ✅ checkmarks
- **Pages Updated:** overview.md, index.md, people/scout.md, people/vault.md, people/ember.md, people/revs.md
- **Source:** memory/2026-05-27.md (crew agents built and deployed)
- **2026-05-29 — Shared UI Design System shipped:** `workspace/shared-ui/` (`@openclaw/ui`) created as single design source of truth. Nexus dark navy theme extracted into Card, Button, Badge, StatusDot, PageHeader, EmptyState, NavBar components + master globals.css. Dossier (was white/shadcn) and Universe (was cream/Radix) fully ported to navy. shadcn, @base-ui/react, all Radix UI packages removed. All three apps build clean and live at :3000/:3001/:3002.
- **2026-05-29 — Mobile Responsive shipped:** Dossier and Universe now match Nexus mobile UX. Bottom tab nav, safe-area iPhone padding, responsive single-column layouts, 44px tap targets, PWA viewport meta on both apps.
