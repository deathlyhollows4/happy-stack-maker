# CodeWise — Condensed Prompt Summary

TanStack Start v1 app on Lovable Cloud (Cloudflare Workers + Supabase). Monorepo, single codebase — no separate backend.

## Stack
- TanStack Start v1.167 (file-based routing), React 19, Vite 7
- Supabase JS client (RLS on all tables), Cloudflare Workers SSR
- Tailwind v4 (oklch dark theme), shadcn/ui, Fraunces + Inter + JetBrains Mono
- Lovable AI Gateway -> openai/gpt-5-mini
- Paddle payments (merchant of record via Lovable Gateway)
- Plausible analytics (privacy-first, SPA pageviews)
- Zod validation, react-hook-form, TanStack React Query 5

## Key files
- `src/lib/codewise.functions.ts` — ALL server functions (reviewCode, getDashboard, admin fns, blog CRUD, config get/set, etc.)
- `src/lib/entitlements.server.ts` — Plan detection + quota consumption (reads limits from app_config DB table)
- `src/lib/blog-posts.ts` — BlogPost type only (data now in blog_posts DB table)
- `src/integrations/supabase/` — AUTO-GENERATED, DO NOT EDIT
- `src/integrations/lovable/index.ts` — DO NOT DELETE (OAuth bridge)
- `src/routeTree.gen.ts` — AUTO-GENERATED, DO NOT EDIT
- `src/routes/` — file-based routing
- `supabase/migrations/` — SQL files (run manually on Supabase)

## What's built (45 sessions, 9 phases)
| Phase | What |
|-------|------|
| 1 Auth | login, signup, forgot/reset password, Google OAuth, auth callback, session middleware |
| 2 Payments | Paddle pricing ($20/mo, $199/yr), checkout, webhook, subscriptions, freemium gating, usage counters |
| 3 UI | dashboard + stats + mastery bars + knowledge graph (d3-force, 20 topics), review page (CodeMirror), practice page, submission detail, billing |
| 4 SEO | landing page, /learn/$slug (20 SEO pages), /s/$id share route, OG image API, /explore blog (5 posts) |
| 5 Research | scripts/eval.ts (CSV->AI->precision/recall/F1), settings/export page (JSON/CSV) |
| 6 Admin | user_roles + has_role, admin dashboard (users/stats/subs), seats, export, curriculum mapping, update Paddle price |
| 7 UX | top nav redesign, React Query caching, skeleton loading, markdown rendering, code-run button, content style guidelines |
| 8 Admin Controls | admin nav link + route guards, dynamic config (app_config DB + admin.settings.tsx), blog CMS (blog_posts DB + admin.blog.tsx), Plausible analytics, security hardening |
| 9 Mobile UX | responsive mobile-first layout (review.tsx, submission.$slug, s.$slug, practice.tsx), green success styling for code reviews, fixed duplicate navbar on learn.$slug.tsx, practice sidebar overflow fix |

## DB tables (public schema, 12 tables)
profiles, topics (20 DSA rows), submissions, review_issues, progress (BKT-lite), practice_problems, subscriptions (Paddle), usage_counters, user_roles, app_config, blog_posts, curriculum_mappings

## Commands
```
npm run dev     # local dev server
npm run build   # production build
npx tsx scripts/eval.ts --limit 0   # eval dry-run
npx gitnexus status    # check index freshness
npx gitnexus analyze   # reindex (~18s)
```

## Remaining (6.2)
- Plausible dashboard account setup (code is done — just sign up at plausible.io and add domain)
- User study scaffolding (consent flow, anonymized telemetry for ICNDIA paper)

## Credentials
Login: vidhantomar17082004@gmail.com / Jaatdevta@123
Paddle test: 4242 4242 4242 4242 / 123 / any future date

## Live URL
https://happy-stack-maker.lovable.app/

## Workflow
1. `gitnexus analyze` if index stale -> `gitnexus_impact` on target symbol -> edit -> `npm run build` -> fix TS -> `gitnexus_detect_changes` -> commit
2. Push -> user republishes on Lovable -> test at live URL
3. DO NOT EDIT: supabase integration files, lovable/index.ts, routeTree.gen.ts, paddle.server.ts, Lovable-generated migrations

## Admin access
Only Vidhan (vidhantomar17082004@gmail.com) has admin role. Admin nav link appears when logged in. All admin pages protected by beforeLoad route guards + server-side isAdmin() checks.

## GitNexus stats
1,807 nodes . 2,902 edges . 49 clusters . 61 execution flows
