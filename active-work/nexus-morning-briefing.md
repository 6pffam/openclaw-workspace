# Nexus Morning Briefing

**Status:** COMPLETE
**Started:** 2026-05-27
**Goal:** A /today page in Nexus — single-view daily briefing with pending tasks, latest agent digests, today's memory summary, and calendar events. Becomes the default home page.

## Confirmed Decisions
- Weather: ❌ not included
- Calendar: ✅ Google Calendar integration (Phase 3)
- Default page: ✅ /today replaces /team as home

---

## Phase 1 — Data APIs

- [x] /api/today — aggregates: pending tasks, latest EMBER artifact preview, latest REVS artifact preview, today memory headline
- [x] Scan artifacts/ for most recent EMBER and REVS output files

## Phase 2 — Briefing Page UI

- [x] /today page — greeting + current date/time header
- [x] Pending approvals widget — count + list of tasks needing action
- [x] Latest EMBER digest card — title, date, 2-line preview, link to full artifact
- [x] Latest REVS brief card — title, date, 2-line preview, link to full artifact
- [x] Today's memory summary — headline lines from today's memory file
- [x] Active crew status strip — how many agents active right now

## Phase 3 — Calendar Integration

- [x] /api/today/calendar — fetch today's events from Google Calendar via gog CLI
- [x] Calendar widget on /today — upcoming events for today and tomorrow
- [x] Handle empty calendar gracefully

## Phase 4 — Make /today the Default

- [x] Update root redirect (/) to point to /today instead of /team
- [x] Add TODAY tab to NavBar (first position)

## Phase 5 — Final Check

- [x] All widgets load and handle missing data gracefully
- [x] Build: clean
