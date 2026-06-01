# Design System — Kone's App Suite
*Reference document for building new apps in the same style as Nexus, Dossier, and Universe.*

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5, strict mode |
| Styling | Tailwind CSS v4 |
| React | React 19 |
| Database | better-sqlite3 (local SQLite, server-side only) |
| Icons | lucide-react |
| Package manager | npm |

All apps are **local-first** — no cloud backend, no external auth, data stored under `~/.openclaw/workspace/<appname>/.data/`.

---

## Colors

Defined in `@openclaw/ui/globals.css` and imported in every app. **Do not hardcode values — use these tokens or their hex equivalents inline when Tailwind classes aren't available.**

```css
/* Surfaces */
--color-navy:     #0d1b2a   /* page background */
--color-card:     #0f2236   /* card / sidebar / panel */
--color-card-alt: #132033   /* elevated card variant */

/* Text */
--color-text-primary: #ffffff
--color-text-muted:   rgba(255, 255, 255, 0.55)
--color-text-subtle:  rgba(255, 255, 255, 0.3)
--color-text-faint:   rgba(255, 255, 255, 0.2)

/* Borders */
--color-border:       rgba(255, 255, 255, 0.06)
--color-border-soft:  rgba(255, 255, 255, 0.08)
--color-border-faint: rgba(255, 255, 255, 0.04)

/* Accent */
--color-blue:   #60a5fa   /* primary interactive, active states */
--color-green:  #34d399   /* success, positive */
--color-amber:  #f59e0b   /* warning, highlight */
--color-red:    #ef4444   /* error, danger */
--color-violet: #a78bfa   /* secondary accent */
```

---

## Typography

System font stack — no custom fonts loaded:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Typical usage patterns:
- Page title: `text-2xl font-semibold text-white`
- Section header: `text-xs font-medium uppercase tracking-wider` + `color: rgba(255,255,255,0.4)`
- Body: `text-sm` + `color: rgba(255,255,255,0.7)`
- Muted / meta: `text-xs` + `color: rgba(255,255,255,0.35)`
- Monospace: `'SF Mono', 'Fira Code', monospace`

---

## Layout & Structure

### globals.css
Every app imports the shared tokens first, then adds app-specific overrides:

```css
@import "tailwindcss";
@import "@openclaw/ui/globals.css";

/* app-specific overrides here */
```

### Root layout (`app/layout.tsx`)
```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '@/components/nav/NavBar'
import BottomNav from '@/components/nav/BottomNav'

export const metadata: Metadata = {
  title: 'AppName',
  description: 'One-line description',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AppName',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d1b2a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="pb-safe">
        <div className="hidden md:block"><NavBar /></div>
        <main className="min-h-screen pt-4 md:pt-16 px-4 md:px-6 pb-24 md:pb-8">
          {children}
        </main>
        <div className="block md:hidden"><BottomNav /></div>
      </body>
    </html>
  )
}
```

### Page max-width
```tsx
<div className="max-w-5xl mx-auto">
```

---

## Navigation

### Desktop NavBar
- Fixed top, `z-50`, `background: #0d1b2a`, `borderBottom: 1px solid rgba(255,255,255,0.05)`
- Tabs centered in a pill container: `background: #0f2236`, `borderRadius: full`
- Active tab: `background: rgba(255,255,255,0.12)`, white text
- Inactive tab: transparent background, `color: rgba(255,255,255,0.45)`
- Font: `text-xs font-semibold tracking-widest uppercase`

### Mobile BottomNav
- Fixed bottom, `z-50`, `background: #0d1b2a`, `borderTop: 1px solid rgba(255,255,255,0.08)`
- `padding-bottom: max(env(safe-area-inset-bottom), 8px)` (safe area)
- Each tab: icon (emoji or lucide) + label below
- Active: label `color: #60a5fa` + small blue dot indicator
- Inactive: label `color: rgba(255,255,255,0.35)`

---

## Cards & Panels

Standard card:
```tsx
<div
  className="rounded-2xl p-5"
  style={{
    background: '#0f2236',
    border: '1px solid rgba(255,255,255,0.06)',
  }}
>
```

Elevated / hover state:
```tsx
style={{ background: '#132033', border: '1px solid rgba(255,255,255,0.08)' }}
```

Section label inside card:
```tsx
<h2
  className="text-xs font-semibold tracking-wider uppercase mb-4"
  style={{ color: 'rgba(255,255,255,0.35)' }}
>
  Section Title
</h2>
```

---

## Lists & Rows

Typical contact/item list container:
```tsx
<div style={{ background: '#0f2236', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
  {items.map((item, i) => (
    <div
      key={item.id}
      className="flex items-center gap-3 px-5 py-4 transition-all cursor-pointer hover:bg-white/[0.02]"
      style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
    >
      {/* content */}
    </div>
  ))}
</div>
```

Row chevron:
```tsx
<span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</span>
```

---

## Filter Sidebar

Desktop: sticky sidebar, `width: 240`, `background: #0f2236`, `borderRadius: 16`, `padding: 20px 16px`
Mobile: off-canvas drawer, `width: 280`, same background, with backdrop overlay

Filter label:
```tsx
<label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
  Label
</label>
```

Filter input:
```tsx
<input
  className="w-full px-3 py-2 rounded-lg text-sm outline-none text-white placeholder:text-white/30"
  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
/>
```

Chip (selected filter tag):
```tsx
<span
  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
  style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}
>
  {value}
  <button onClick={() => remove(value)} className="opacity-60 hover:opacity-100">×</button>
</span>
```

---

## Buttons

Primary action:
```tsx
<button
  className="px-4 py-2 rounded-xl text-sm font-medium"
  style={{ background: '#3b82f6', color: 'white' }}
>
```

Secondary / ghost:
```tsx
<button
  className="px-4 py-2 rounded-xl text-sm font-medium"
  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
>
```

Destructive:
```tsx
style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
```

---

## Status / Notification Banners

Success:
```tsx
style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
```

Error:
```tsx
style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
```

Info / blue:
```tsx
style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }}
```

---

## Loading & Empty States

Loading:
```tsx
<div className="flex items-center justify-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>
  Loading…
</div>
```

Empty:
```tsx
<div className="flex flex-col items-center justify-center py-16 gap-3">
  <span className="text-4xl">🔍</span>
  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Nothing here yet.</p>
</div>
```

---

## API Routes

Standard pattern — always check auth + DB open before anything:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/session'
import { isDbOpen } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated || !isDbOpen()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... handler logic
  return NextResponse.json(result)
}
```

---

## Authentication

- PIN-based, session cookie, no external auth
- Cookie: `HttpOnly; SameSite=Strict; Max-Age=900` (15 min)
- App starts at `/lock` if unauthenticated
- `lib/session.ts` → `isAuthenticated()` used in every API route
- `lib/auth.ts` → `verifySessionToken()`, `createSessionToken()`

Lock page pattern: centered card on navy background, PIN input, submit calls `/api/auth/verify`.

---

## Database

```ts
import Database from 'better-sqlite3'
```

- Stored at: `~/.openclaw/workspace/<appname>/.data/<appname>.db`
- Data dir created with mode `0o700` if missing
- Server-side only (never imported in Client Components)
- `lib/db.ts` exports: `getDb()`, `isDbOpen()`, `getDbPath()`
- Schema migrations are plain SQL run at startup
- All queries use prepared statements with `?` placeholders

---

## PWA / Home Screen Icon

Each app has `app/icon.tsx` and `app/apple-icon.tsx` using Next.js ImageResponse:

```tsx
import { ImageResponse } from 'next/og'
export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{ background: '#0d1b2a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#ffffff', fontSize: 96, fontWeight: 800, fontFamily: 'sans-serif' }}>X</span>
    </div>,
    { ...size }
  )
}
```

`app/apple-icon.tsx` is identical but with `size = { width: 180, height: 180 }`.

`public/manifest.json`:
```json
{
  "name": "AppName",
  "short_name": "AppName",
  "display": "standalone",
  "background_color": "#0d1b2a",
  "theme_color": "#0d1b2a",
  "icons": [
    { "src": "/icon", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/apple-icon", "sizes": "180x180", "type": "image/png", "purpose": "any" }
  ]
}
```

---

## File Structure

```
app/
  layout.tsx          # root layout with nav
  page.tsx            # root redirect or landing
  globals.css         # @import tailwindcss + @openclaw/ui + overrides
  icon.tsx            # PWA icon (Next.js ImageResponse)
  apple-icon.tsx      # iOS home screen icon
  lock/page.tsx       # PIN lock screen
  [feature]/
    page.tsx          # server component shell
    [Feature]Client.tsx  # 'use client' interactive component
  api/
    auth/
      verify/route.ts
    [feature]/route.ts
components/
  nav/
    NavBar.tsx        # desktop top nav
    BottomNav.tsx     # mobile bottom nav
lib/
  db.ts               # SQLite setup
  session.ts          # cookie auth helpers
  auth.ts             # token creation/verification
  [feature].ts        # domain logic, DB queries
public/
  manifest.json
```

---

## Key Conventions

1. **`'use client'`** only on interactive leaf components. Page files (`page.tsx`) are server components; they render a `<FeatureClient />` component that holds all state.
2. **Inline styles over Tailwind** for anything using the color tokens — keeps values consistent and avoids Tailwind v4 JIT misses on dynamic values.
3. **No external UI libraries** (no shadcn, no MUI) — everything is hand-rolled to match the design.
4. **`rounded-2xl`** (16px) for cards, `rounded-xl` (12px) for buttons/inputs, `rounded-lg` (8px) for small elements, `rounded-full` for chips/pills.
5. **Transition:** `transition-all` on interactive elements; no complex animations.
6. **Mobile-first responsive:** sidebar hidden on mobile (`hidden md:block`), drawer replaces it; bottom nav shown only on mobile (`block md:hidden`).
7. **Port convention:** Nexus :3000, Dossier :3001, Universe :3002 — new apps start at :3003+.
