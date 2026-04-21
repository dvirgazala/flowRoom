# Project Context

Hebrew RTL social network for Israeli music creators. Core USP: end-to-end rights & royalties management.

## Tech Stack

- Next.js 16.2.3 (App Router + Turbopack)
- React 19 (use `use(params)` for async dynamic params)
- TypeScript 5 strict (Types live in `lib/types.ts`)
- Tailwind CSS 4 (CSS-first config via `@theme` in `app/globals.css`)
- Zustand 5 (Single store at `lib/store.ts` with `persist` middleware)
- Supabase (full DB — auth, rooms, members, messages, stems, tasks, notifications, profiles)

## Critical Rules

1. **RTL-First:** UI is Hebrew RTL (`direction: rtl`). Every layout decision must account for RTL (e.g., `mr-auto` / `ml-auto` are flipped). Visually verify chevrons/arrows.
2. **State Management:** Supabase (`lib/db.ts`) is the source of truth for all room/social data. Zustand (`lib/store.ts`) holds `currentUser`, theme, toast, splitSheets, earnings. Component `useState` is fine for local fetch results (members, messages, etc.).
3. **Array Fallbacks:** Always guard persisted arrays (e.g., `(p.comments || [])`).
4. **Audio Invariant:** All `AudioPlayer` instances listen to `window` custom event `flowroom:audio-play`. Playing one pauses others.
5. **No tests:** Build is the ONLY type-check gate: `npm run build`.

## Commands

- Build & Type-check: `npm run build` (Run before every push)
- Lint: `npm run lint`

## Deployment Flow

- Deployment is to Render via `git push origin master`.
- The user does NOT use localhost (`npm run dev`).
- Always run `/deploy` after finishing a batch of changes.
- NEVER say "done" without running `/verify-before-done`.
