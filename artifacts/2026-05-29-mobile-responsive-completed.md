# Mobile Responsive — Dossier & Universe

**Status:** ✅ COMPLETE
**Started:** 2026-05-29
**Owner:** FORGE
**Goal:** Apply Nexus mobile best practices to Dossier (:3002) and Universe (:3001). Both apps need: PWA viewport meta, bottom tab nav on mobile, hidden top nav on desktop, safe-area padding, responsive layouts, 44px tap targets.

---

## Nexus Mobile Patterns to Copy Exactly

### layout.tsx pattern
```tsx
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d1b2a',
}

// body layout:
// <div className="hidden md:block"><NavBar /></div>
// <main className="min-h-screen pt-4 md:pt-16 px-4 md:px-6 pb-24 md:pb-8">{children}</main>
// <div className="block md:hidden"><BottomNav /></div>
```

### BottomNav pattern (from nexus/components/nav/BottomNav.tsx)
- Fixed bottom, z-50, navy background, borderTop
- `paddingBottom: 'max(env(safe-area-inset-bottom), 8px)'` — iPhone home indicator safe area
- Icon + label + active blue dot per tab
- min 44px tap target per tab

### globals.css additions
```css
.pb-safe { padding-bottom: env(safe-area-inset-bottom); }
```

### Responsive rules
- Single column layouts on mobile (< 768px)
- No horizontal overflow
- Cards full-width on mobile
- Modals work when iOS keyboard opens

---

## Phase 1 — Dossier Mobile ✅ COMPLETE

Dossier has 3 pages: Cases dashboard (/), Case detail (/cases/[id]), Results viewer (/cases/[id]/results/[version])

- [x] Add `Viewport` export to `app/layout.tsx` (themeColor, no user-scale)
- [x] Create `components/nav/BottomNav.tsx` — tab: Cases (🗂 /)
- [x] Update `app/layout.tsx` — add BottomNav (mobile only), pb-safe on body
- [x] Cases dashboard (`app/page.tsx`) — sidebar hidden on mobile (`hidden md:block`), px-4 mobile, pb-28 mobile
- [x] Case detail (`app/cases/[id]/page.tsx`) — `flex-col md:flex-row`, version sidebar full-width on mobile
- [x] Results viewer — px-4, pb-28 mobile, breadcrumb overflow safe
- [x] `NewCaseModal` — slides up from bottom on mobile (`items-end md:items-center`), rounded-t-2xl on mobile
- [x] All tap targets minimum 44px height on CTAs
- [x] `npm run build` clean ✅
- [x] Restart dossier LaunchAgent

## Phase 2 — Universe Mobile ✅ COMPLETE

- [x] Add `Viewport` export to `app/layout.tsx`
- [x] Create `components/nav/BottomNav.tsx` — 4 tabs: Contacts / Connections / Interlocks / Memory
- [x] Update `AppShell.tsx` — top nav `hidden md:block`, separate mobile header (app name + lock button), bottom nav mobile only
- [x] Main content padding: `px-4 md:px-6 pb-28 md:pb-6` for bottom nav clearance
- [x] Contacts list — search full-width on mobile, tier filter pills scroll horizontally (overflow-x-auto)
- [x] Contact detail — grid gap responsive `gap-4 md:gap-6`
- [x] Connections graph — layout stacks vertically on mobile, graph `minHeight: 60vh`, sidebar full-width on mobile
- [x] AddConnectionModal — slides up from bottom, safe-area bottom padding, overflowY scroll
- [x] Interlocks — "Reached out" button minHeight 44px
- [x] Lock/Setup PIN screens — already centered, now have safe-area via Viewport
- [x] `npm run build` clean ✅
- [x] Restart universe LaunchAgent

---

## Key Decisions
- Bottom nav tabs: Dossier single "Cases" tab (only one main route), Universe 4 tabs matching AppShell nav
- ForceGraph on mobile: stacks below sidebar, takes 60vh min height; D3 touch events work natively
- WorkspaceSidebar in Dossier: hidden on mobile with `hidden md:block`
- Modals: both Dossier NewCaseModal and Universe AddConnectionModal now slide up from bottom on mobile (sheet pattern) — keyboard safe
- PIN/auth screens: already centered dark navy, now have PWA viewport
