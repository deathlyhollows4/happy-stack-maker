# Fix Connectivity & Polish Across All Features

## Context

`LOVABLE_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Lovable Cloud at runtime — they don't need to be in `.env`. The "AI not configured" symptom in local dev is expected; in deployed preview/prod the keys are present. So the real bugs are routing, error handling, and a few UX gaps.

## Fixes

### 1. Broken navigation (HIGH)
- `src/routes/_authenticated/practice.tsx:193` — `nav({ to: "/submission/$submissionId" })` works (route is at `_authenticated/submission.$submissionId.tsx`, URL is `/submission/:id`). **Verify** — likely fine, the `_authenticated` segment is a pathless layout.
- `src/routes/pricing.tsx:114` — logged-in CTA links to `/app` which doesn't exist. Change to `/dashboard`.

### 2. Silent error swallowing (HIGH)
- `practice.tsx` `onGen` — wrap in try/catch, toast on failure.
- `settings.tsx` delete-account handler — add catch + toast.
- `codewise.functions.ts` `review_issues` insert — check + log error.

### 3. Feature audit (non-AI)
Quick check each route loads and primary action works:
- `/dashboard` — progress + recent submissions render
- `/review` — file upload + paste both submit
- `/practice` — generate → run → submit flow
- `/billing` — portal link, cancel dialog
- `/settings` — display name, password, theme toggle, delete
- `/explore`, `/learn/$slug` — public content renders
- `/pricing` → checkout → `?checkout=success` toast on dashboard
- Past-due banner shows when subscription status is `past_due`

I'll spot-check each route file for obvious bugs (missing imports, broken links, unhandled promises) rather than runtime-testing every flow.

### 4. Minor cleanup
- Consolidate the duplicate `admin()` singleton in `account.functions.ts` — use the shared `supabaseAdmin` from `client.server.ts` instead.

## Out of scope
- Env var setup (handled by Lovable Cloud auto-injection)
- Paddle keys (already in secrets per `<secrets>` listing)
- New features

## Files to edit
- `src/routes/pricing.tsx` (1 link)
- `src/routes/_authenticated/practice.tsx` (try/catch)
- `src/routes/_authenticated/settings.tsx` (try/catch)
- `src/lib/codewise.functions.ts` (error check)
- `src/lib/account.functions.ts` (use shared admin client)
- Plus whatever the route audit surfaces
