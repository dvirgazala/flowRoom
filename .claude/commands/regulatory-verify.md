---
description: Check which regulatory rules in FlowRoom are stale (not verified in 30+ days) and guide the admin through re-verifying them against official sources.
---

# /regulatory-verify

Use when a user or admin suspects regulatory data (ACUM forms, PIL rates, deadlines) may be outdated, or as a routine monthly check.

## Steps

1. Fetch all rules from Supabase `regulatory_rules` table using `fetchAllRules()` from `lib/regulatory.ts`.
2. Run `isStale()` on each rule's `last_verified_at`. List all stale rules grouped by body.
3. For each stale rule, show:
   - Body name + kind
   - Last verified date
   - Official source URL (open it)
   - What specifically to check (e.g., for ACUM body_meta: form fields, ISWC format, writer registration flow)
4. After the admin confirms each rule is still correct, call `verifyRule(id, verifiedBy)` to update `last_verified_at` to now.
5. If a rule changed, call `updateRuleField()` with the new content and explain what was updated.

## What to check per body

- **ACUM**: acum.org.il — composer registration form fields, ISWC format, annual deadline (usually May 31)
- **PIL**: pil.org.il — master owner registration, quarterly distribution schedule
- **Eshkolot**: eshkolot.com — performer registration, neighboring rights eligibility
- **Distributor**: distrokid.com — pricing, payout minimums, USD/ILS rate (check Bank of Israel for current rate)
- **YouTube CID**: studio.youtube.com/channel help — CID eligibility, claim dispute window

## Notes

- Never auto-publish changes — always confirm with the admin first.
- If the table doesn't exist yet, point to `supabase/regulatory_rules.sql` and ask them to run it in Supabase SQL Editor.
- After verifying, the UI will show updated "אומת: DATE" stamps in every RegistrationModal.
