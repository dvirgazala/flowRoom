# FlowRoom — Project Instructions

> Hebrew RTL social network for Israeli music creators. Core USP: end-to-end rights & royalties management (Split Sheets → Registration → Earnings).

## Essential context

Load the full architecture skill before starting any non-trivial work:
```
/flowroom-context
```
That skill (`.claude/skills/flowroom-context/SKILL.md`) contains the complete stack, folder structure, coding rules, domain knowledge, and deployment flow. These instructions here are intentionally short — everything authoritative is in the skill.

## Critical facts (read even if you skip the skill)

- **Deployment**: `git push origin master` → Render auto-deploys. User does NOT use localhost. Always push after finishing a batch of changes — use `/deploy`.
- **Language**: UI is Hebrew RTL (`direction: rtl`). All user-facing strings are in Hebrew. Code and comments are in English.
- **Stack**: Next.js 16.2.3 + React 19 + TypeScript 5 strict + Tailwind CSS 4 + Zustand 5 + Supabase
- **No tests**: `npm run build` is the only type-check gate. Run before every push.
- **State**: Everything goes through `lib/store.ts`. No local state for data that should persist across pages.

## Commands

```bash
npm run dev      # local dev (user doesn't use this — Render only)
npm run build    # type-check + production build ← run before every push
npm run lint     # ESLint
```

## Verification rule — mandatory before reporting done

**Never tell the user a feature is ready without running `/verify-before-done`.**
The skill at `.claude/skills/verify-before-done/SKILL.md` defines the full checklist:
build pass → DB schema confirmed → notification rows confirmed → RLS logic confirmed → Realtime confirmed.

Past failures happened when changes were reported as done but the DB column didn't exist, a CHECK constraint blocked inserts, or a table wasn't in the Realtime publication. Always verify in the actual DB, not just in code.

## Custom slash commands

| Command | Purpose |
|---|---|
| `/deploy` | Build → stage → commit → push to Render |
| `/verify-before-done` | Run full verification checklist before reporting a feature as ready |
| `/regulatory-verify` | Check and re-verify stale regulatory rules |
| `/flowroom-context` | Load full architecture context (do this first) |

## Regulatory freshness

Regulatory rules (ACUM forms, PIL rates, deadlines) live in Supabase `regulatory_rules` table.
- SQL schema: `supabase/regulatory_rules.sql`
- Admin panel: `/admin/regulatory`
- Rules older than 30 days show a warning in the UI automatically.
- Run `/regulatory-verify` monthly to stay current.
