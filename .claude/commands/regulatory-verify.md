---
description: Check which regulatory rules in FlowRoom are stale (not verified in 30+ days) and guide the admin through re-verifying them against official sources.
---

# /regulatory-verify

Use when a user or admin suspects regulatory data (ACUM forms, PIL rates, deadlines) may be outdated, or as a routine monthly check.

## Steps

1. **Fetch Data:** Query Supabase directly:
```bash
SUPABASE_ACCESS_TOKEN=sbp_5bcd0b516c02e75d459d8aaca4500f51865952fe \
npx supabase db query --linked \
"SELECT id, body, field_name, last_verified_at FROM regulatory_rules ORDER BY last_verified_at ASC;"
```
2. **Analyze:** Run `isStale()` (or check manually if `last_verified_at` is older than 30 days). List all stale rules grouped by body.
3. **Verify per Body:** For each stale rule, attempt to fetch the official source URL using curl or a similar tool.
   - _CRITICAL:_ If the website blocks bots or requires complex rendering, STOP and output the URL. Ask the admin to manually open the link, check the specific criteria (see below), and paste the updated text back into the chat.
4. **Update & Commit DB:** After the admin confirms the data or provides new data, create another temporary `.ts` script to call `verifyRule(id, verifiedBy)` and/or `updateRuleField()`. Execute it with `npx tsx`, confirm the DB change, and delete the script.
5. Summarize what was verified and updated.

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
