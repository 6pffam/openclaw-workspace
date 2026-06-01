# Nexus on Mobile

**Status:** COMPLETE
**Started:** 2026-05-27
**Goal:** Make Nexus fully usable on mobile with responsive layouts, bottom tab navigation, and PWA installation via Safari "Add to Home Screen" on iPhone.

## Confirmed Decisions
- PWA: ✅ installable via Safari → Add to Home Screen
- Navigation: ✅ bottom tab bar on mobile
- Hidden tabs on mobile: ✅ Office tab hidden (pixel art unusable on small screens)
- Icon: ✅ ⚡ on dark blue

---

## Phase 1 — PWA Setup

- [x] Create /public/manifest.json — app name "Nexus", theme #0d1b2a, display standalone
- [x] Generate app icons — 192x192 and 512x512 (SVG rendered to PNG)
- [x] Add PWA meta tags to app/layout.tsx — viewport, apple-touch-icon, theme-color
- [x] Add apple-mobile-web-app-capable and status-bar-style meta tags (iOS specific)
- [x] Verify "Add to Home Screen" prompt works in Safari

## Phase 2 — Responsive Navigation

- [x] Bottom tab bar component — shows on screens < 768px
- [x] Hide top pill NavBar on mobile
- [x] Bottom tabs: TODAY, TEAM, TASKS, MEMORY, PROJECTS, WIKI (no OFFICE)
- [x] Active tab highlight on bottom bar
- [x] Keep Save (↑) button accessible — move to top-right header on mobile

## Phase 3 — Responsive Page Layouts

- [x] Team page — single column, crew cards full width
- [x] Projects page — single column cards, WBS/Create Plan buttons tappable
- [x] Tasks page — Kanban columns scroll horizontally with snap
- [x] Memory page — date dropdown replaces sidebar on mobile
- [x] WBS page — phases stack full width
- [x] Today page — single column widgets
- [x] Wiki page — readable prose on narrow screens

## Phase 4 — Touch Polish

- [x] All tap targets minimum 44px height
- [x] No horizontal overflow on any page at 390px width
- [x] Modals work correctly when iOS keyboard opens
- [x] Smooth scrolling on all pages

## Phase 5 — Final Check

- [x] Test all pages at 390px (iPhone 15 viewport)
- [x] PWA installs from Safari and opens full-screen
- [x] Build: clean
