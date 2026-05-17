# CodeWise — Condensed Prompt Summary

TanStack Start v1 app on Lovable Cloud (Cloudflare Workers + Supabase). Monorepo, single codebase — no separate backend.

## Stack
- TanStack Start v1.167 (file-based routing), React 19, Vite 7
- Supabase JS client (RLS on all tables), Cloudflare Workers SSR
- Tailwind v4 (oklch dark theme), shadcn/ui, Fraunces + Inter + JetBrains Mono
- Lovable AI Gateway → google/gemini-3-flash-preview
- Paddle payments (merchant of record via Lovable Gateway)
- Zod validation, react-hook-form, TanStack React Query 5

## Key files
- `src/lib/codewise.functions.ts` — ALL server functions (reviewCode, getDashboard, getAdminDashboard, exportUserData, getCurriculumMappings, etc.)
- `src/integrations/supabase/` — AUTO-GENERATED, DO NOT EDIT
- `src/integrations/lovable/index.ts` — DO NOT DELETE (OAuth bridge)
- `src/routes/` — file-based routing
- `supabase/migrations/` — SQL files (run manually on Supabase)

## What's built (15 sessions, all 6 phases)
| Phase | What |
|-------|------|
| 1 Auth | login, signup, forgot/reset password, auth callback, session middleware |
| 2 Payments | Paddle pricing, checkout, webhook, subscriptions, freemium gating, usage counters |
| 3 UI | dashboard + stats + mastery bars + knowledge graph (d3-force, 20 topics, pan/zoom), review page (CodeMirror), practice page, submission detail page |
| 4 SEO | landing page, /learn/$slug (20 SEO pages), /s/$id share route, OG image API |
| 5 Research | scripts/eval.ts (CSV→AI gateway→precision/recall/F1), settings/export page (JSON/CSV) |
| 6 Admin | user_roles table + has_role fn, /admin/dashboard (users/stats/subs), /admin/seats (grant/revoke admin), /admin/export (all data JSON/CSV), /admin/curriculum (SPPU/NPTEL inline edit) |

## Commands
```
npm run dev     # local dev server
npm run build   # production build (client + SSR)
npx tsx scripts/eval.ts --limit 0   # dry-run eval; remove --limit 0 to call AI
```

## Remaining (never built)
- Billing page UI at /_authenticated/billing (server fns exist)
- Past-due banner in authenticated layout
- ?checkout=success toast after Paddle
- Google OAuth (manual Supabase + GCP setup needed)
- Analytics (Plausible/PostHog)
- User study scaffolding (consent flow, telemetry)

## DB tables (public schema, RLS enabled)
profiles, topics (20 DSA rows seeded), submissions, review_issues, progress (BKT-lite), practice_problems, subscriptions (Paddle), usage_counters, user_roles, curriculum_mappings

## Credentials
Login: vidhantomar17082004@gmail.com / Jaatdevta@123
Paddle test: 4242 4242 4242 4242 / 123 / any future date

## Live URL
https://happy-stack-maker.lovable.app/

## Workflow
1. Edit files → `npm run build` → fix TS errors
2. Git commit + push → user republishes on Lovable
3. Test at live URL
4. DO NOT edit: supabase integration files, lovable/index.ts, routeTree.gen.ts, paddle.server.ts
