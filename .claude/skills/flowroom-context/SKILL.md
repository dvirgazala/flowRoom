---
name: flowroom-context
description: Load FlowRoom's full architectural context — stack, folder layout, state model, deployment flow, Israeli royalty domain knowledge, and strict coding rules. Invoke before any non-trivial work on the FlowRoom codebase.
---

# FlowRoom — Project Context Skill

> This file is the single source of truth for working on FlowRoom. Read it end-to-end before making architectural decisions, adding features, or refactoring. It is authoritative over general conventions.

---

## 1. Primary Goal

FlowRoom is a **Hebrew RTL social network for Israeli music creators** with one critical differentiator: **taking responsibility for musicians' rights and royalty income end-to-end**.

The product has five pillars:

| Pillar | Route | What it does |
|---|---|---|
| **Feed** | `/feed` | Music-first social feed — posts, audio, collab requests |
| **Rooms** | `/rooms`, `/rooms/[id]` | Collaborative production spaces — stems, tasks, chat, stages |
| **Rights** | `/rights`, `/rooms/[id]/splits`, `/earnings` | The core USP — Split Sheet Builder → Registration Cockpit → Earnings Inbox |
| **Marketplace / Gigs** | `/marketplace`, `/gigs` | Beats, mixing services, session work |
| **Discover / Profile** | `/discover`, `/profile/[id]` | Creator discovery + public profiles |

**The rights pipeline is the product's heart.** Any feature that isn't feed/rooms/rights/market/discover is probably out of scope.

---

## 2. Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| Framework | **Next.js 16.2.3** | App Router + Turbopack. APIs differ from earlier versions — read `node_modules/next/dist/docs/` if unsure. |
| UI Library | **React 19** | Use `use(params)` for async dynamic params — do NOT destructure `params` directly. |
| Language | **TypeScript 5 strict** | No `any` without justification. Types live in `lib/types.ts`. |
| Styling | **Tailwind CSS 4** | CSS-first config via `@theme` in `app/globals.css`. `tailwind.config.ts` exists for compatibility. |
| State | **Zustand 5** | Single store at `lib/store.ts` with `persist` middleware, localStorage key `flowroom-store`. |
| Icons | **Lucide React** | All icons. No mixed icon libraries. |
| Auth / DB | **Supabase** | `lib/db.ts`. Currently minimal — auth only. All other state lives client-side. |
| Deployment | **Render** from `git push origin master` | User does NOT use `npm run dev`. Every change must be pushed to be visible. |

No tests. Build is the only type-check gate: `npm run build`.

---

## 3. Architecture Patterns

### Route grouping (App Router)
```
app/
├── (auth)/          # login, signup — no Navbar/layout wrappers
├── (main)/          # authenticated routes — wraps with Navbar + BottomNav + Toast + ThemeApplier
├── admin/           # separate admin layout
├── posts/[id]/      # standalone dynamic route
├── globals.css      # @theme tokens, print styles, theme-switching transitions
├── layout.tsx       # root HTML + RTL direction
└── page.tsx         # redirects to /feed
```

### Single-store pattern
All state mutations flow through Zustand actions in `lib/store.ts`. Never keep long-lived state in component-local `useState` if it should persist across pages or sessions.

**Persisted slices** (via `partialize`): `currentUser`, `users`, `posts`, `rooms`, `adminLogs`, `theme`, `splitSheets`, `earningsBatches`, `earningsLines`.

### Design tokens
Two-file setup: `app/globals.css` `@theme` block (CSS variables) + `tailwind.config.ts` (compat). Theme switching via `html[data-theme="light"|"dark"]` + scoped `.theme-switching` class for transitions.

### RTL-first
`html { direction: rtl }`. Every layout decision must account for RTL:
- `mr-auto` and `ml-auto` are visually flipped.
- `space-x-reverse` needed when using `space-x-N` inside RTL.
- Left-chevron icons point to the "next" direction visually.

### Single-audio coordination
All `AudioPlayer` instances listen to `window` custom event `flowroom:audio-play` with `detail: instanceId`. Playing one pauses others. Keep this invariant when touching audio code.

---

## 4. Folder Structure

```
New Media Social Media/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx              # Navbar + BottomNav + Toast + ThemeApplier
│   │   ├── feed/page.tsx
│   │   ├── rooms/
│   │   │   ├── page.tsx            # room list
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # room detail (chat/files/activity/tasks)
│   │   │       ├── splits/page.tsx # Split Sheet Builder
│   │   │       └── flow/page.tsx   # production stage flow
│   │   ├── rights/page.tsx         # Rights Cockpit (5 bodies)
│   │   ├── earnings/page.tsx       # Earnings Inbox
│   │   ├── discover/page.tsx
│   │   ├── marketplace/page.tsx
│   │   ├── gigs/page.tsx
│   │   ├── profile/[id]/page.tsx
│   │   └── settings/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── dashboard/page.tsx
│   ├── posts/[id]/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── BottomNav.tsx
│   ├── Avatar.tsx
│   ├── AudioPlayer.tsx
│   ├── VerifiedBadge.tsx
│   ├── ProfileHoverCard.tsx
│   ├── DmChatModal.tsx
│   ├── PaymentModal.tsx
│   ├── RegistrationModal.tsx       # per-body royalty registration
│   ├── ThemeApplier.tsx
│   └── Toast.tsx
├── lib/
│   ├── store.ts                    # Zustand — all mutations
│   ├── data.ts                     # seed data (USERS, ROOMS, FEED_POSTS, PRODUCTS, STAGES, AUDIO)
│   ├── types.ts                    # all TypeScript types
│   └── db.ts                       # Supabase client
├── .claude/
│   ├── settings.local.json
│   └── skills/                     # project-level skills (this file lives here)
├── public/
├── tailwind.config.ts
└── CLAUDE.md                       # workspace-level (parent dir)
```

---

## 5. Strict Coding Rules

### R1 — All state via the store
Never persist UI state with `useState` if it should survive a page change. Add a slice + action to `lib/store.ts`. Exception: ephemeral form inputs, modal open/closed flags.

### R2 — Guard persisted arrays
Old localStorage data may predate new array fields. Always read with fallback:
```ts
(p.comments || [])
(r.chatMessages ?? [])
(sh.registrations ?? [])
```

### R3 — RTL-aware layouts
Every new component must be reviewed in RTL. Test by thinking: "does `ml-auto` look right here?" For icons that imply direction (chevron, arrow), visually verify.

### R4 — Supabase-safe persistence
When adding a new persisted slice, also add it to `partialize` in the `persist` config — otherwise it only lives in-memory.

### R5 — No speculative abstractions
FlowRoom ships features fast. Three similar pieces of code is better than a premature hook/util. Only extract when the 4th duplication appears.

### R6 — No comments explaining WHAT
The code should be self-documenting. Only comment non-obvious WHY: regulatory constraints, hidden invariants, workarounds tied to specific bugs. Never narrate structure ("This section handles X") — the section name or headers already do that.

### R7 — Verify with `npm run build`
Before committing, run `npm run build` to catch TS errors. No tests exist; the build is the only gate.

### R8 — Deployment flow is push-to-master
The user deploys to Render via `git push origin master`. After finishing a batch of changes:
1. `git add app components lib` (specific dirs, never `-A`)
2. `git commit` with a structured message
3. `git push origin master`
4. Render auto-builds and deploys (~1-2 min)

**Don't wait for the user to ask for the push — it's assumed at the end of every feature batch.**

---

## 6. Component Conventions

### Cards
```tsx
<div className="bg-bg1 rounded-2xl shadow-surface p-5">    // standard
<div className="bg-bg1 rounded-2xl shadow-surface-lg p-6"> // elevated (modals)
```
Rely on shadow for depth. Borders in dark mode are 6% white — barely visible.

### Primary CTAs
```tsx
<button className="bg-brand-gradient rounded-xl text-white hover:opacity-90 shadow-glow-sm">
```
`bg-brand-gradient` = `linear-gradient(135deg, #a855f7, #ec4899)`.

### Gradient text
```tsx
<span className="grad-text">FlowRoom</span>
```

### Modals
```tsx
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center modal-backdrop" onClick={onClose}>
  <div className="bg-bg1 rounded-2xl p-6 max-w-md shadow-surface-lg modal-card" onClick={e => e.stopPropagation()}>
```
`modal-backdrop` + `modal-card` classes animate the open.

### Lists with dropdown details
Expandable rows pattern — use `ChevronDown` rotated 180° when expanded. See `/earnings` byTrack section.

### Stats cards
Helper pattern — 4-column on desktop, 2-column on mobile:
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
```

---

## 7. Domain Knowledge — Israeli Royalty System

### Three independent royalty streams per track
Every recorded song generates up to three separate revenue streams, each split 100% independently:

1. **Publishing** — who wrote the song (lyrics/composition/arrangement) → collected by **ACUM (אקו"ם)**
2. **Master** — who owns the recording → collected by **PIL (הפיל)** for producers/labels, **Eshkolot (אשכולות)** for performing artists
3. **Producer points** — carved out of master share by contract → no external body, distributed via master collection

### Identifiers
- **ISRC** — International Standard Recording Code (per recording)
- **ISWC** — International Standard Work Code (per composition)

### 5 registration bodies (see `BODIES` const in `/rights/page.tsx`)
| Body | Relevant split | Purpose |
|---|---|---|
| **ACUM** | publishing | Public performance & mechanical for writers |
| **PIL** | master | Radio/TV/events for master owners |
| **Eshkolot** | master | Neighboring rights for performers |
| **DistroKid (distributor)** | both | Streaming distribution (Spotify/Apple/YT Music/TikTok) |
| **YouTube Content ID** | master | UGC monetization on YouTube |

### Sheet lifecycle
`draft` → `pending_signatures` (any participant has signed) → `locked` (everyone signed). Changes to shares/roles in a category invalidate signatures **in that category only** — not across all three.

### Registration lifecycle
`not_registered` → `pending` (submitted) → `registered` (confirmed) or `rejected`. A sheet must be `locked` before registration can be submitted (enforced in `RegistrationModal`).

---

## 8. Common Pitfalls & Patterns

### React 19 dynamic params
```tsx
// Wrong
export default function Page({ params }: { params: { id: string } }) {
  const id = params.id // deprecated pattern

// Right
import { use } from 'react'
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
```

### Currency in Earnings
All displays show native currency (₪/$/€). Aggregations convert USD→ILS at fixed 3.7 rate (see `toILS` helper in `earnings/page.tsx`). If/when we wire up a live rate API, it must use the regulatory freshness pattern (see §9).

### Turbopack + Windows paths
Shell is bash but OS is Windows. Always use forward slashes in paths inside tool calls. For the working directory with Hebrew characters (`דביר`), quote the path.

---

## 9. Upcoming System — Regulatory Freshness

The next major system is **keeping the product fresh with external reality**: new ACUM forms, updated PIL rates, new Israeli copyright laws, changes to YouTube CID eligibility. Planned in 6 layers:

1. Move `BODIES` config + form fields from code → Supabase `regulatory_rules` table with `effective_from`, `last_verified_at`, `source_url`, `version`.
2. Internal CMS at `/admin/regulatory` with version history.
3. Weekly cron + Gemini agent that diffs official pages and posts suggestions to admin inbox.
4. Human-in-the-loop approval (never auto-publish).
5. User-facing "עודכן לאחרונה: X" timestamps on every form.
6. User feedback button ("הטופס לא נראה ככה באתר") → admin inbox.

When working on this system, reuse the Gemini + Supabase infrastructure from other projects (Multi Agent Musician has 4 Gemini keys with rotation, Cubase To Phone has Telegram alerts).

---

## 10. Recommended Custom Slash Commands

These aren't built yet — create when the pain is real:

### `/deploy`
Runs build → stages `app components lib` → commits with auto-generated message from git diff → pushes to `origin master`. Replaces the 4-step manual flow.

### `/verify-regulatory`
Once the freshness system exists — triggers the Gemini diff pass on-demand instead of waiting for the weekly cron. Reports pending changes in admin inbox.

### `/new-room-route`
Scaffolds a new sub-route under `/rooms/[id]/*` with the standard params pattern (React 19 `use`), breadcrumb, and store hook setup.

---

## 11. How to Use This Skill

1. **Start of a session on FlowRoom** — read this file fully.
2. **Mid-session, before a non-trivial change** — reread §5 (rules) and §6 (conventions).
3. **When adding a feature that touches rights/royalties** — reread §7 (domain knowledge).
4. **When the user says "זה לא מופיע באתר"** — reread §8 deployment (commit + push).

This file is the authoritative reference. If this file contradicts general training knowledge, **this file wins**.
