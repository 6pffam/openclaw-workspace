# Shared UI Design System

**Status:** ✅ COMPLETE
**Started:** 2026-05-29
**Owner:** FORGE
**Goal:** Extract Nexus's design (dark navy, fonts, tokens) into a shared `workspace/shared-ui/` local npm package. Wire all three apps (Nexus, Dossier, Universe) to it. Port Dossier and Universe to the Nexus look and feel. Single source of truth for design going forward.

---

## Design Reference — Nexus
- Background: `#0d1b2a` (navy)
- Card surface: `#0f2236`
- Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Text primary: `white`
- Text muted: `rgba(255,255,255,0.4–0.7)`
- Accent: `#f59e0b` (amber), `#60a5fa` (blue), `#34d399` (green)
- Border: `rgba(255,255,255,0.05–0.08)`
- Scrollbar: custom dark (`#1e3a5f` thumb)
- Pure Tailwind v4, no component library, hand-rolled components

## Architecture
```
workspace/
  shared-ui/           ← single source of truth
    package.json       ← name: "@openclaw/ui"
    globals.css        ← all theme tokens + base styles
    components/
      Card.tsx
      Button.tsx
      Badge.tsx
      NavBar.tsx        (base nav shell — each app customises tabs)
      StatusDot.tsx
      PageHeader.tsx
      EmptyState.tsx
  nexus/               → "file:../shared-ui"
  dossier/             → "file:../shared-ui"
  universe/            → "file:../shared-ui"
```

---

## Phase 1 — Build shared-ui package ✅ COMPLETE

- [x] Create `workspace/shared-ui/` directory
- [x] Write `package.json` (`@openclaw/ui`, version 1.0.0, exports map)
- [x] Write `globals.css` — copy and clean Nexus theme tokens as the master
- [x] Write `Card.tsx` — dark card surface, border, rounded-xl
- [x] Write `Button.tsx` — primary (amber), secondary (ghost), danger variants
- [x] Write `Badge.tsx` — status chips (active/idle/planned + generic)
- [x] Write `StatusDot.tsx` — glowing green/grey dot
- [x] Write `PageHeader.tsx` — title + subtitle pattern
- [x] Write `EmptyState.tsx` — icon + message + optional CTA
- [x] Write `NavBar.tsx` — base pill nav shell with slots for left/right

## Phase 2 — Wire Nexus to shared-ui (zero visual change) ✅ COMPLETE

- [x] Add `"@openclaw/ui": "file:../shared-ui"` to nexus/package.json
- [x] Replace nexus/app/globals.css import with shared-ui globals.css
- [x] Add `transpilePackages: ['@openclaw/ui']` to next.config.ts
- [x] `npm run build` clean ✅

## Phase 3 — Port Dossier ✅ COMPLETE

- [x] Add `@openclaw/ui` dependency to dossier/package.json
- [x] Remove shadcn/ui, @base-ui/react, tw-animate-css, class-variance-authority dependencies
- [x] Replace dossier/app/globals.css with shared-ui globals.css
- [x] Add `transpilePackages` to dossier next.config.ts
- [x] Re-theme layout.tsx (dark navy background, remove Geist fonts)
- [x] Port Cases dashboard page to Nexus style
- [x] Port Case Detail / Editor page
- [x] Port Results Viewer page (editorial feel, dark version)
- [x] Replace all shadcn components (Button, Card, Badge, Input, Textarea, Dialog) with dark inline equivalents
- [x] Remove components/ui/ directory (shadcn files)
- [x] `npm run build` clean ✅
- [x] Restart dossier LaunchAgent

## Phase 4 — Port Universe ✅ COMPLETE

- [x] Add `@openclaw/ui` dependency to universe/package.json
- [x] Remove Radix UI dependencies, class-variance-authority
- [x] Replace universe/app/globals.css with shared-ui globals.css (keep tier/cat color vars)
- [x] Add `transpilePackages` to universe next.config.ts
- [x] Re-theme AppShell (dark navy nav, pill tabs matching Nexus)
- [x] Re-theme PIN auth screen (lock + setup pages)
- [x] Port Contacts list page
- [x] Port Contact detail card
- [x] Port Connections graph page (D3 — node/text colors updated, logic unchanged)
- [x] Port CategoryManager + AddConnectionModal
- [x] Port Interlocks page
- [x] Port Memory page
- [x] `npm run build` clean ✅
- [x] Restart universe LaunchAgent

## Phase 5 — Final check ✅ COMPLETE

- [x] All three apps load correctly at :3000, :3001, :3002
- [x] Consistent dark navy look across all three
- [x] shared-ui globals.css is the single source of truth — no per-app theme overrides
- [x] Document shared-ui in wiki

---

## Key Decisions
- No monorepo complexity — plain `file:` local npm dependency
- Universe D3 graph: re-skinned node/link colours to navy palette, no logic changes
- Dossier Results Viewer: stays editorial/reading-focused but dark
- PIN auth screen (Universe): dark navy, security UX intact
- shadcn and Radix removed entirely — reduces dep tree, simplifies maintenance
- Universe kept tier/category color vars in app-specific CSS (needed by ForceGraph)
