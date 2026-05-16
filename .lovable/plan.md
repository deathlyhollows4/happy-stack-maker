## Goal

Produce an updated `.docx` document for the user to hand to Cursor AI, reflecting (a) the **actual tech stack that got built** (not the original Next.js + FastAPI plan), and (b) a **clear "what's done / what's left" status** so Cursor can pick up where Lovable left off.

This is a one-off artifact generation — no app code changes.

## Source of truth (verified)

**Actual stack now in the repo (replaces the original Next.js + FastAPI + Prisma plan):**
- TanStack Start v1 (React 19, Vite 7) — file-based routing under `src/routes/`
- TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui (Radix primitives) + Fraunces (display) / Inter (body) typography
- TanStack Router + TanStack React Query
- Server logic: TanStack `createServerFn` (in `src/lib/codewise.functions.ts`) — no separate Python/FastAPI backend, no Prisma
- Supabase (via Lovable Cloud) — Postgres + Auth (email/password); RLS-backed tables
- AI: Lovable AI Gateway (`google/gemini-3-flash-preview`) using `LOVABLE_API_KEY`
- CodeMirror 6 editor (Python/JS/Java/C++)
- Hosting: Lovable (Cloudflare Workers via `@cloudflare/vite-plugin`)

**DB tables already live:** `profiles`, `topics`, `submissions`, `review_issues`, `progress`, `practice_problems` (with the `handle_new_user` trigger for profile creation).

**Routes already built:**
- `/` landing page (CodeWise marketing)
- `/login`, `/signup` (email + password)
- `/_authenticated` layout (sidebar + auth gate, client-side session check)
- `/_authenticated/dashboard` (stats + topic mastery + recent reviews)
- `/_authenticated/review` (code editor → AI review)
- `/_authenticated/practice` (AI-generated practice problems)

**Server functions already built** (`src/lib/codewise.functions.ts`):
`reviewCode`, `getDashboard`, `getSubmission`, `generatePractice`, `listPractice` — all behind `requireSupabaseAuth`, with BKT-lite mastery update logic.

**What is NOT built yet** (gaps to call out for Cursor):
- No payments / Stripe / freemium gating
- No "share your review score" viral loop
- No knowledge-graph visualization
- No college-license / team accounts
- No password reset / Google OAuth (only email+password)
- No analytics, no SEO landing pages beyond `/`
- No exports, no NPTEL / SPPU curriculum mapping UI
- No research-paper artifacts (corpus, evaluation harness)

## Document structure I'll produce

`CodeWise_Status_Handoff_to_Cursor.docx` (US Letter, Fraunces-equivalent serif headings, clean tables — same vibe as the original):

1. **Cover / Metadata** — project, date (16 May 2026), handoff target (Cursor AI), short note that the original 9-day plan has been partially executed on Lovable and the stack diverged.
2. **What changed vs original plan** — short table: original → actual (Next.js→TanStack Start, FastAPI→createServerFn, Prisma→Supabase, DeepSeek→Lovable AI Gateway/Gemini, Railway→Cloudflare Workers).
3. **Current Tech Stack** — full table by layer (frontend, routing, styling, server logic, database, auth, AI, editor, hosting) with versions from `package.json`.
4. **Repository layout** — actual tree (`src/routes/`, `src/lib/codewise.functions.ts`, `src/integrations/supabase/*`, etc.) instead of the original speculative tree.
5. **Database schema (as deployed)** — table-by-table summary of the 6 tables actually in Supabase, with key columns and the BKT mastery semantics.
6. **Server functions (as deployed)** — one row per `createServerFn` with method, auth, inputs, behavior.
7. **What's built ✅ / What's left ⏳** — checklist mapped against the original 9-day plan so Cursor sees exactly where to resume.
8. **Recommended next steps for Cursor** — concrete ordered list: (a) Google OAuth + password reset, (b) Stripe freemium gating, (c) knowledge-graph viz on dashboard, (d) share-score viral loop, (e) admin/college dashboard, (f) research corpus + eval harness.
9. **Environment & secrets** — what's already configured in Lovable Cloud (`LOVABLE_API_KEY`, `SUPABASE_*`) and what Cursor needs to add locally (`.env` mirror) when running outside Lovable.
10. **Sections preserved from original** — SEO/keywords table, revenue model, research paper plan, post-launch roadmap (lightly trimmed, since these are still valid).

Generated via `docx-js` per the docx skill, validated, page-by-page QA'd as PNGs, then written to `/mnt/documents/CodeWise_Status_Handoff_to_Cursor.docx` and surfaced via `<presentation-artifact>`.

## Out of scope

- No changes to source code, routes, schema, or design tokens.
- No regeneration of charts/images from the original doc — descriptive tables only (faster, cleaner for handoff).
- No PDF export unless you ask.
