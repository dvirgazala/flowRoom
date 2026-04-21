---
name: verify-before-done
description: Use when a feature is complete, or when the user runs /verify-before-done, BEFORE reporting the task as finished.
---

# Pre-Completion Verification Checklist

## Process
You must verify the following items using the terminal. Do not guess. Do not skip.

### 1. Build Check
```bash
cd "New Media Social Media" && npm run build
```
Must show `✓ Compiled successfully` with zero TypeScript errors. If it fails — fix and re-run.

---

### 2. Database Schema — query the ACTUAL DB, not the SQL files

The SQL files in `supabase/` reflect intent, not reality. Always verify against the live DB:

```bash
SUPABASE_ACCESS_TOKEN=sbp_5bcd0b516c02e75d459d8aaca4500f51865952fe \
npx supabase db query --linked "<query>" \
--workdir "New Media Social Media"
```

Project ref: `jukwewqgjipughiuxlck` (link once per session with `npx supabase link --project-ref jukwewqgjipughiuxlck`).

| What to verify | Query |
|---|---|
| Column exists | `SELECT column_name FROM information_schema.columns WHERE table_name='X'` |
| Policy exists | `SELECT policyname, cmd FROM pg_policies WHERE tablename='X'` |
| CHECK constraint | `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='X'` |
| Realtime table | `SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime'` |

---

### 3. For notification features — verify a row lands in the DB

After triggering the action (promote admin, invite, etc.):
```bash
SUPABASE_ACCESS_TOKEN=sbp_5bcd0b516c02e75d459d8aaca4500f51865952fe \
npx supabase db query --linked \
"SELECT type, message, created_at FROM notifications ORDER BY created_at DESC LIMIT 5;"
```
If the expected notification doesn't appear → the insert failed → check CHECK constraint on `type` column.

---

### 4. Realtime — verify table is in publication
```bash
SUPABASE_ACCESS_TOKEN=sbp_5bcd0b516c02e75d459d8aaca4500f51865952fe \
npx supabase db query --linked \
"SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' ORDER BY tablename;"
```

---

### 5. Output a verification report
State clearly: build ✓, DB columns ✓, constraints ✓, realtime ✓ — then and only then say the feature is ready.

---

## Key failures to avoid

| Past bug | Root cause | Catch it with |
|---|---|---|
| `isAdmin` always false | `currentUser.id` was mock `'u1'`, not Supabase UUID | Trace `currentUser` source in AuthGuard |
| Notifications not inserted | CHECK constraint on `notifications.type` blocked new type | Step 3 + check `pg_constraint` |
| Realtime didn't fire | Table not in publication | Step 4 |
| `is_admin` updates silently failed | Column didn't exist in DB | Step 2 |
| RLS blocked admin updates | Policy only checked `created_by` | Step 2 → `pg_policies` |
