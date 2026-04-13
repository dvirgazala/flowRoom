# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important:** This is Next.js 16.2.3 with React 19. APIs and conventions differ from older versions. Read `node_modules/next/dist/docs/` before writing Next.js-specific code.

## Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Type-check + production build (use to verify before finishing)
npm run lint     # ESLint
```

There are no tests. Use `npm run build` to catch TypeScript errors.

## Stack

- **Next.js 16.2.3** — App Router, all routes under `app/`
- **React 19** — `use(params)` for async params in dynamic routes
- **TypeScript 5** — strict
- **Tailwind CSS 4** — CSS-first config via `@theme` in `app/globals.css`; `tailwind.config.ts` for compatibility
- **Zustand 5** — single store with `persist` middleware, localStorage key `flowroom-store`
- **Lucide React** — all icons

## Architecture

### Route layout

```
app/
  (auth)/          # login, signup — no Navbar
  (main)/          # all authenticated pages — wraps with Navbar + Toast + ThemeApplier
    feed/
    discover/
    marketplace/
    rooms/
      page.tsx     # room list
      [id]/
        page.tsx   # room detail (chat, files, activity, tasks)
        splits/    # royalty splits per room
        flow/      # production stage flow
    profile/[id]/
    settings/
  admin/           # admin dashboard, separate layout
  page.tsx         # redirects to /feed
```

### State: `lib/store.ts`

Single Zustand store. All mutations go through store actions. Persisted fields: `currentUser`, `users`, `posts`, `rooms`, `adminLogs`, `theme`.

Key patterns:
- Always use `(p.comments || [])` and `(r.chatMessages ?? [])` when reading arrays — old localStorage data may lack fields added after initial persist.
- `addRoom` returns the new room ID (string) so callers can navigate to it.
- `showToast(message, type)` auto-clears after 3.5s.

### Data: `lib/data.ts`

Static seed data: `USERS` (u1–u12), `ROOMS` (r1–r4), `FEED_POSTS`, `PRODUCTS`, `STAGES` (7 production stages), `AUDIO` URLs (soundhelix.com public domain). No backend — all state lives in the Zustand store. Avatars use `pravatar.cc` with fixed `?img=N` per user ID (defined in `Avatar.tsx`).

### Design system

Design tokens defined in both `app/globals.css` (`@theme` block) and `tailwind.config.ts`. CSS variables (`--bg0`, `--bg1`, `--bg2`, `--bg3`) drive **dark/light theming** — `ThemeApplier` sets `data-theme` on `<html>`, and `globals.css` has overrides under `html[data-theme="light"]`.

**Card depth pattern** — cards use shadow instead of visible borders:
```tsx
<div className="bg-bg1 rounded-2xl shadow-surface">   // standard card
<div className="bg-bg1 rounded-2xl shadow-surface-lg"> // modal/elevated
```

`border border-border` on cards produces nearly invisible lines (overridden to 6% white opacity in dark mode) — rely on shadow for visual separation.

**Brand gradient:** `bg-brand-gradient` = `linear-gradient(135deg, #a855f7, #ec4899)`. Used on primary buttons, active states, and accents.

**RTL:** `html { direction: rtl }` — the entire app is Hebrew RTL. All layout must account for this.

### Single-audio-player coordination

`AudioPlayer` dispatches `window.dispatchEvent(new CustomEvent('flowroom:audio-play', { detail: instanceId }))` on play, and listens to pause other instances. All audio players on the page coordinate via this event.

### Components

| Component | Purpose |
|---|---|
| `Avatar` | Photo (pravatar.cc) with initials fallback; sizes: sm/md/lg/xl |
| `AudioPlayer` | Waveform + compact modes; single-play coordination via custom event |
| `VerifiedBadge` | Purple-to-pink gradient ✓ badge |
| `ProfileHoverCard` | 350ms delay hover popup with user stats |
| `DmChatModal` | Full DM modal with simulated replies |
| `PaymentModal` | Credit card modal with visual card preview + processing state |
| `ThemeApplier` | Reads `theme` from store, sets `data-theme` on `<html>` |
| `Toast` | Reads `toast` from store, renders fixed notification |
| `Navbar` | Fixed top nav with notifications dropdown, user menu |

### Modals

All modals use:
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[N] flex items-center justify-center modal-backdrop" onClick={onClose}>
  <div className="... modal-card" onClick={e => e.stopPropagation()}>
```
`modal-backdrop` and `modal-card` CSS classes apply fade-in and slide-up animations.

### Auth flow

No real auth. Login page (`/login`) shows quick-login buttons for all 12 seed users. `currentUser` in store drives auth state; `null` = logged out. Login/signup pages use `(auth)` layout group (no Navbar).

### Admin

`/admin` — separate route group with its own layout. Admin dashboard at `/admin/dashboard` lets admins warn/suspend/unsuspend/verify users and view logs.
