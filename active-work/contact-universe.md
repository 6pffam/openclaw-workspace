# Contact Universe

**Status:** IN PROGRESS
**Started:** 2026-05-27
**Owner:** FORGE
**Goal:** A radically private, localhost-only dashboard over Google Contacts. Living contact cards, force-directed connections graph, interlock cadence tracking, and a memory viewer over Scribe's output. All private data encrypted on-device, never cloud-synced.

---

## Phase 0 - Exploration & Planning (FORGE)

- [x] Explore ~/.openclaw/workspace/ - report file structure and real data available
- [x] Report what each phase-1 screen can populate from real data today
- [x] Ask clarifying questions from exploration
- [x] Propose phased build plan within phase 1
- [x] Wait for Kone's approval before building

## Confirmed Decisions
- **Project path:** ~/.openclaw/workspace/universe/
- **OAuth:** Next.js route handler, token at workspace/universe/.token
- **Port:** 3001
- **Standalone app:** yes, separate visual identity (cream/off-white, not Nexus dark navy)
- **Memory source:** workspace/memory/YYYY-MM-DD.md (same path Scribe writes to)
- **Multi-category graph:** concentric color rings (innermost = primary, outer = secondary)
- **Build order:** approved - 1A → 1B → 1C → 1D → 1E

## Phase 1A - Foundation (vertical slice)

- [x] Project scaffold: Next.js 16 + TypeScript + Tailwind v4 at workspace/universe/
- [x] SQLite database with PIN auth + Argon2id (SQLCipher-ready, key derived from PIN + machine salt)
- [x] First-run onboarding (PIN setup screen)
- [x] 15-minute idle auto-lock (client-side event listener + /api/auth/lock)
- [x] Google Contacts sync - People API OAuth flow (route handler + /api/google/callback) + full sync endpoint
- [x] Contacts screen: filterable list, tier filter, avatar rings, review status
- [x] Contact detail card: Google data (read-only) + all private fields (notes, tier, tags, origin, review status, update log)
- [x] `npm run build` clean ✅ - runs on port 3001

## Phase 1B - Connections

- [x] Force-directed graph (D3 force simulation, drag, zoom, pan)
- [x] Relationship categories CRUD (sidebar, add/delete, color picker)
- [x] Category filter (graph redraws with only the filtered connections)
- [x] Connection creation modal (person A ↔ B, symmetric/directional toggle, multi-category select)
- [x] Multi-category rendering: concentric color rings per node (innermost = primary, outer = secondary)
- [x] Node click panel (view card link, connect button)
- [x] Link click panel (categories shown, remove connection)
- [x] `npm run build` clean ✅

## Phase 1C — Interlocks

- [x] Cadence tiers (Inner Circle=30d, Active Network=90d, Long Orbit=365d) + per-contact override
- [x] Overdue engine (status: overdue / due-soon / active / no-cadence), sorted by urgency
- [x] One-click "Reached out" confirm — resets clock on last_interlock_date + last_contact_date
- [x] Inline cadence override editor (set custom days per contact, save + confirm in one click)
- [x] Summary cards (overdue / due-soon / active counts)
- [x] Collapsible sections (active + no-cadence collapsed by default)
- [x] Discord digest endpoint (/api/discord/digest) — tries Discord webhook, falls back to Telegram
- [x] Digest cron: scripts/send-digest.sh + scripts/install-cron.sh (launchd, 08:00 Zurich)
- [x] `npm run build` clean ✅

## Phase 1D - Memory

- [ ] Three-view toggle (contact-scoped / project-scoped / full journal)
- [ ] Full-text search across memory files
- [ ] Quick-note append path
- [ ] Filesystem watcher (chokidar) for live updates

## Phase 1E - Contacts Tab Upgrade ✅ COMPLETE

### Decisions locked
- **"Not yet reviewed"** = `importance_tier IS NULL` (never assigned by user). DB migration required:
  - Change column default from `'None'` to `NULL`
  - Backfill: `UPDATE contacts SET importance_tier = NULL WHERE review_status = 'unreviewed' AND importance_tier = 'None'`
  - New contacts from Google sync already don't set `importance_tier` on INSERT — with NULL default they'll auto-land in "Not yet reviewed" ✅
- **"None"** = explicitly assigned by user (remains as string `'None'`)
- **Tier assignment** (bulk or individual) must also set `review_status = 'reviewed'`
- **Country**: parse best-effort from the last comma-delimited segment of the formatted address string. No new DB column needed.
- **Top search bar** (name/company/email) stays and coexists with the Keyword filter in the panel.
- **Filter panel layout**: sidebar on desktop (≥768px); collapsible slide-in drawer on mobile (<768px).
- **Tier multi-select**: combinable (e.g. Active Network + Long Orbit together). "All" resets to showing everything.

### Tasks

- [x] **DB migration** (`lib/db.ts`)
  - Add migration block to `runMigrations()`: alter `importance_tier` column default to NULL; run backfill UPDATE
  - Use a `meta` table version key (`contacts_tier_null_migration`) to run only once

- [x] **`lib/contacts.ts`** — update data layer
  - `getAllContacts` opts: replace `tier: ImportanceTier | 'all'` with `tiers: string[]`
    - Empty array or `['all']` = no tier filter
    - `'not-yet-reviewed'` in array → `importance_tier IS NULL`
    - Other values → `importance_tier IN (...)`
    - Multiple values combined with OR
  - Add `companies: string[]` filter → `company IN (...)`
  - Add `country: string` filter → parse last segment of each address in `addresses` JSON, match substring
  - Add `keyword: string` filter → `display_name LIKE ? OR company LIKE ? OR emails LIKE ? OR phones LIKE ? OR notes LIKE ? OR tags LIKE ? OR job_title LIKE ? OR addresses LIKE ?`
  - Add `getDistinctCompanies(): string[]` — `SELECT DISTINCT company FROM contacts WHERE company IS NOT NULL AND company != '' ORDER BY company`
  - Add `getDistinctCountries(): string[]` — load all non-empty addresses, parse last segment, dedupe, sort

- [x] **`app/api/contacts/route.ts`** — accept new query params
  - `tiers` (repeatable: `?tiers=Inner+Circle&tiers=Long+Orbit`) or comma-separated
  - `companies` (repeatable)
  - `country` (single string)
  - `keyword` (single string)

- [x] **`app/api/contacts/meta/route.ts`** — new GET endpoint
  - Returns `{ companies: string[], countries: string[] }`
  - Used by filter panel to populate dropdowns on load

- [x] **`app/api/contacts/bulk-tier/route.ts`** — new POST endpoint
  - Body: `{ contactIds: string[], tier: string | null }`
  - For each ID: set `importance_tier = tier`, `review_status = 'reviewed'`, `updated_at = now()`
  - Returns `{ updated: number }`

- [x] **`app/contacts/ContactsClient.tsx`** — full upgrade (keep file, rewrite contents)

  **Layout:**
  - Desktop: `flex` row — `240px` filter panel (fixed width, scrollable) + flex-1 contact list column
  - Mobile: single column; filter panel hidden by default, revealed by "Filters" button as slide-in overlay drawer from left

  **Tier chips bar** (above contact list, same position as today):
  - Chips: All · Inner Circle · Active Network · Long Orbit · None · Not yet reviewed
  - State: `selectedTiers: Set<string>` — clicking a tier toggles it in/out of the set
  - "All" chip: clicking it clears `selectedTiers` entirely (shows everything)
  - "All" chip is highlighted when `selectedTiers` is empty
  - Multiple tiers can be active simultaneously (OR logic)

  **Left filter panel:**
  - **Company** typeahead: text input → filters `companies[]` list from `/api/contacts/meta` as user types (client-side filter on the fetched list, no extra API call); selected companies shown as removable chips below input; multi-select
  - **Country** select: dropdown populated from `countries[]` from `/api/contacts/meta`; single select (or "Any")
  - **Keyword** input: free text, searches all fields server-side
  - "Clear all filters" link at bottom of panel when any filter is active
  - Panel fetches meta once on mount; refetches after sync

  **Contact list rows:**
  - Checkbox on left (visible on hover of any row, or always visible when ≥1 contact selected)
  - Clicking a row navigates to contact detail ONLY when no contacts are selected (clicking a row when in selection mode toggles checkbox instead)
  - "Select all" checkbox in the table header row (selects all currently visible contacts)

  **Bulk action bar** (floating, bottom of screen):
  - Appears when `selectedContacts.size >= 1`
  - Shows: `{N} selected` · tier dropdown (All options incl. "Not yet reviewed" → null) · **Apply** button · **Clear** link
  - On Apply: POST to `/api/contacts/bulk-tier`, then refetch list and clear selection
  - Smooth slide-up animation on appear/disappear

  **Mobile drawer:**
  - "Filters" button in header row (shows active filter count badge if any active)
  - Drawer slides in from left, overlays content, backdrop click closes it
  - Same panel contents as desktop sidebar

- [x] `npm run build` clean ✅

## Phase 2 - Later

- [ ] Tasks board
- [ ] Insights screen (Scout-powered public scans)
