# Nexus Polish

**Status:** COMPLETE
**Started:** 2026-05-27
**Goal:** Three remaining Nexus backlog items — Memory viewer tab, Team screen last-active time, and LaunchAgent auto-start.

---

## Phase 1 — Nexus LaunchAgent (auto-start)

- [x] Create ~/Library/LaunchAgents/ai.openclaw.nexus.plist
- [x] Verify correct node/npm paths
- [x] Load with launchctl
- [x] Confirm Nexus survives a process kill + auto-restarts

## Phase 2 — Team Screen Polish (last active time)

- [x] Extend /api/crew to include lastActiveAt per agent from session files
- [x] Update Team screen UI — show "active X min ago" or "idle Xh ago"
- [x] Handle agents with no session history gracefully

## Phase 3 — Memory Viewer

- [x] Create /api/memory — lists memory files, returns parsed content
- [x] Create /memory page — date list + markdown reader
- [x] Add Memory tab to NavBar
- [x] Build: clean

## Phase 4 — Final Check

- [x] All routes 200
- [x] LaunchAgent confirmed running
- [x] Nexus auto-restarted after manual kill test
