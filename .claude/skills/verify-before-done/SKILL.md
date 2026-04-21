---
name: verify-before-done
description: Verification checklist to run before telling the user a feature is ready. Always run this before reporting completion.
---

# FlowRoom — Verification Before Done

**Never say a feature is done without completing every applicable check below.**

---

## 1. Build passes

```bash
cd "New Media Social Media" && npm run build
```

Must show `✓ Compiled successfully` and `✓ Generating static pages` with zero TypeScript errors. If it fails — fix before reporting done.

---

## 2. DB schema changes — verify in the actual DB

Whenever a migration was applied (ALTER TABLE, new column, new policy, new constraint), query Supabase to confirm it exists:

```bash
SUPABASE_ACCESS_TOKEN=sbp_5bcd0b516c02e75d459d8aaca4500f51865952fe \
npx supabase db query --linked "<verification query>" \
--workdir "New Media Social Media"
```

Examples:
- New column: `SELECT column_name FROM information_schema.columns WHERE table_name='X'`
- New policy: `SELECT policyname FROM pg_policies WHERE tablename='X'`
- CHECK constraint: `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='X'`
- Realtime table: `SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime'`

**If the column/policy/constraint doesn't appear in the query result → the migration didn't run → run it.**

---

## 3. For notification features — verify a row actually lands in the DB

After triggering the feature (promote admin, send invite, etc.), query:

```bash
SUPABASE_ACCESS_TOKEN=sbp_5bcd0b516c02e75d459d8aaca4500f51865952fe \
npx supabase db query --linked "SELECT type, message, created_at FROM notifications ORDER BY created_at DESC LIMIT 3;"
```

If the expected notification type doesn't appear → the insert failed → diagnose (CHECK constraint? RLS? wrong type string?).

---

## 4. For RLS policy changes — verify with a test query

After updating a policy, verify the logic is correct:

```bash
SUPABASE_ACCESS_TOKEN=... npx supabase db query --linked \
"SELECT pg_get_expr(polqual, polrelid) as using, pg_get_expr(polwithcheck, polrelid) as with_check FROM pg_policy WHERE polname='<policy_name>';"
```

---

## 5. Realtime subscriptions — verify tables are in publication

```bash
SUPABASE_ACCESS_TOKEN=... npx supabase db query --linked \
"SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime' ORDER BY tablename;"
```

---

## 6. Code logic trace — before shipping

For any feature that involves:
- A condition check (`isAdmin`, `currentUser?.id === room.created_by`, etc.) → trace the data flow end to end in the code and confirm all fields are populated at runtime
- A Supabase insert → confirm the `type` value is in the CHECK constraint
- A Realtime subscription → confirm the table is in the publication

---

## Key lessons from past failures

| What broke | Root cause | How to catch it |
|---|---|---|
| `isAdmin` always false | `currentUser.id` was mock `'u1'`, not Supabase UUID | Trace `currentUser` source in AuthGuard |
| `room_admin` notifications not inserted | CHECK constraint on `notifications.type` didn't include `room_admin` | Query `pg_constraint` after adding a new type |
| Realtime didn't fire | Table not in `supabase_realtime` publication | Query `pg_publication_tables` |
| `is_admin` updates silently failed | Column didn't exist in DB | Query `information_schema.columns` |
| RLS blocked admin updates | Policy only checked `created_by`, not `is_admin` | Query `pg_policies` + read the USING expression |
