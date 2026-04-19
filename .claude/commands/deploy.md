---
description: Build, commit, and push FlowRoom to Render. Runs TypeScript check first, then stages app/components/lib/supabase, commits with a structured message, and pushes to origin/master.
---

# /deploy

Run this after finishing a batch of changes. FlowRoom deploys to Render from `git push origin master` — the user never uses localhost.

## Steps

1. Run `npm run build` to verify no TypeScript errors. If it fails, stop and report what broke.
2. Run `git status --short` to see what changed.
3. Stage only project files: `git add app components lib supabase public .claude`
4. Write a commit message that summarizes the changes (not a list of files — the *why* and *what* at a high level). Always append `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
5. `git push origin master`
6. Tell the user the push succeeded and to wait ~1-2 min for Render to build.

## Rules

- Never use `git add -A` or `git add .` — it might include `.env`, `node_modules` leftovers, or unrelated files.
- Never skip the build step — a push with TS errors will break the live site.
- If there's nothing to commit (clean working tree), say so and stop.
