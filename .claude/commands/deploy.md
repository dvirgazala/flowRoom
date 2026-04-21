---
description: Build, repair, commit, and push FlowRoom to Render. Runs TypeScript check with auto-fix, stages all project-critical files, and pushes to origin/master.
---

# /deploy

Run this after finishing a batch of changes. FlowRoom deploys to Render from `git push origin master`.

## Steps

1. **Build & Auto-Fix:** Run `npm run build` to verify no TypeScript errors.
   - **If it fails:** Analyze the error output, identify the problematic files, fix the code automatically, and run the build again. Repeat until the build passes.
   - **If persistent:** If you cannot fix it after 3 attempts, stop and explain the blockers.

2. **Check Status:** Run `git status --short` to identify modified files.

3. **Selective Staging:** Stage project logic and configuration files. Do NOT use `git add .`.
   - Run: `git add app components lib supabase public .claude package*.json *.ts *.md`

4. **Structured Commit:**
   - Write a commit message summarizing the _intent_ of the changes.
   - Always append: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`

5. **Push to Render:**
   - Run `git push origin master`.
   - If there is nothing to commit, notify the user and stop.

6. **Post-Push:** Tell the user the push succeeded and to wait ~1-2 min for Render to complete the build.

## Rules

- Never use `git add -A` — protect environment variables and local logs.
- Never skip the build check — the live site depends on it.
- Ensure all new dependencies (in `package.json`) are included in the stage.
