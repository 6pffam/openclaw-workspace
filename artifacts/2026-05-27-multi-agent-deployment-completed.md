# Multi-Agent Deployment

**Status:** COMPLETE
**Started:** 2026-05-27
**Goal:** Register and fully configure all 5 remaining crew agents (SCOUT, SCRIBE, VAULT, EMBER, REVS) — workspaces, identities, cron schedules, and Nexus dashboard integration.

---

## Phase 1 — Workspaces & Identities

- [x] Create workspace directories for all 5 agents
- [x] Write BOOTSTRAP.md for SCOUT
- [x] Write BOOTSTRAP.md for SCRIBE
- [x] Write BOOTSTRAP.md for VAULT
- [x] Write BOOTSTRAP.md for EMBER
- [x] Write BOOTSTRAP.md for REVS

## Phase 2 — Gateway Registration

- [x] Add SCOUT to openclaw.json agents.list
- [x] Add SCRIBE to openclaw.json agents.list
- [x] Add VAULT to openclaw.json agents.list (ollama/qwen2.5:7b)
- [x] Add EMBER to openclaw.json agents.list
- [x] Add REVS to openclaw.json agents.list
- [x] Configure Ollama provider in models.providers
- [x] Update agentToAgent allow list
- [x] Gateway restart

## Phase 3 — Cron Schedules

- [x] SCRIBE — nightly cron 02:00 Zurich
- [x] EMBER — weekly Monday 08:00 Zurich
- [x] REVS — weekly Friday 17:00 Zurich

## Phase 4 — Nexus Dashboard

- [x] Update crew.json — all 5 agents set to active with agentId
- [x] Update wiki people pages — status: active
- [x] Build active-work WBS system (this project)
- [x] WBS page in Nexus with visual tracker
- [x] WBS button on project cards
- [x] Create Plan flow for projects without WBS

## Phase 5 — Validation

- [x] Verify all agents visible in Nexus Team screen
- [x] Trigger SCOUT test session
- [x] Verify SCRIBE can read/write wiki
- [x] Verify VAULT runs on Ollama (local only)
- [x] Trigger EMBER test session
- [x] Trigger REVS test session
