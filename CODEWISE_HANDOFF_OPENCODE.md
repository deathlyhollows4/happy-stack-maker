# CodeWise — Status & Handoff Brief for opencode

**AI Code Reviewer & Learning Companion for CS Students**

| Field                 | Value                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| Project Lead          | Vidhan Tomar — BE IT, Army Institute of Technology, Pune               |
| Built on              | Lovable (preview project)                                              |
| Handoff target        | **opencode** (CLI assistant)                                           |
| Document date         | 19 May 2026 (updated, sessions 51-57)                          |
| Status                | Phase 9 in progress — info, design & nav polish (5/7 sessions done)        |
| Original target conf. | IEEE ICNDIA-2027 (April 2027 submission)                               |

This document supersedes the original 9-day plan. The stack diverged from the initial Next.js + FastAPI design — what is actually running today is a single TanStack Start app on Lovable Cloud (Supabase + Cloudflare Workers + Lovable AI Gateway). Use this as the source of truth when continuing development with opencode.

---

## Session Tracker

> **Say "next session" and opencode reads this file to know exactly what to work on.**

| Phase | Status | Completed | Next Session |
|-------|--------|-----------|--------------|
| 1 — Auth & Access | ✅ **DONE** | 1.1, 1.2, 1.3 | — |
| 2 — Monetization | ✅ **DONE** | 2.1, 2.2, 2.3, 2.4 | — |
| 3 — UI Completion | ✅ **DONE** | 3.1, 3.2, 3.3 | — |
| 4 — Growth & SEO | ✅ **DONE** | 4.1, 4.2, 4.3 | — |
| 5 — Research | ✅ **DONE** | 5.1, 5.2, 5.3 | — |
| 6 — B2B & Admin | ✅ **DONE** | 6.1, 6.2, 6.3, 6.4 | — |
| 7 — UX Improvements | ✅ **DONE** | 7.1, 7.2, 7.3 | — |
| 8 — Admin Controls & Analytics | ✅ **DONE** | 8.1, 8.2, 8.3, 8.4, 8.5 | — |
| 9 — Info, Design & Nav Polish | 🟡 **IN PROGRESS** | 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7 | — |

### Session Log

| # | What | Files |
|---|------|-------|
| 1 | Auth fixes: reset-password race, restore lovable/index.ts, add Toaster, DB error sanitization | `__root.tsx`, `reset-password.tsx`, `integrations/lovable/index.ts`, `codewise.functions.ts` |
| 2 | Paddle payments sprint: pricing, checkout, webhook, subscriptions, usage counters, freemium gating, legal pages | `pricing.tsx`, `webhook.ts`, `billing.functions.ts`, `entitlements.server.ts`, `paddle.server.ts` |
| 3 | Submission detail page + dashboard "View details" links | `review.$submissionId.tsx`, `dashboard.tsx` |
| 4 | Knowledge graph v1: d3-force, 20 topics, prerequisite edges, mastery colors | `knowledge-graph.tsx` (new), `dashboard.tsx` |
| 5 | Knowledge graph v2: viewBox, pan/zoom, control bar, neon glow, route fix (review→submission) | `knowledge-graph.tsx`, `submission.$submissionId.tsx` |
| 6 | Deployment fixes: scroll isolation, boundary clamping, w-full sizing | `knowledge-graph.tsx` |
| 7 | Share-a-review: public `/s/$uuid` route, getPublicSubmission server fn, Share Results button | `s.$submissionId.tsx`, `codewise.functions.ts`, `submission.$submissionId.tsx` |
| 8 | Dynamic OG image: SVG card generation API route, og:image meta tags (fixed .png filename→path bug) | `og.$submissionId.ts`, `s.$submissionId.tsx`, `submission.$submissionId.tsx` |
| 9 | Per-topic SEO landing pages: /learn/$slug route, getTopicBySlug server fn, 20 topic pages with OG meta, related topics, CF Workers routing fix | `learn.$slug.tsx` (new), `codewise.functions.ts`, `.gitignore` |
| 10 | Eval harness: scripts/eval.ts CSV corpus runner, AI gateway calls, precision/recall/F1 per concept, confusion matrix JSON, per-language breakdown, sample corpus | `scripts/eval.ts` (new), `scripts/corpus/labelled-errors.csv` (new) |
| 11 | Export user data: exportUserData server fn, /settings/export page with JSON/CSV download, submissions/issues/progress/practice preview table | `codewise.functions.ts`, `settings.export.tsx` (new) |
| 12 | User roles migration: user_roles table (user_id, role, unique constraint), has_role SECURITY DEFINER function, admin-only RLS policies, public EXECUTE revoked | `supabase/migrations/*_user_roles.sql` (new) |
| 13 | Admin dashboard: getAdminDashboard server fn with has_role guard (service client), /admin/dashboard route with users table, stats cards, plan/subscription/usage columns | `codewise.functions.ts`, `admin.dashboard.tsx` (new) |
| 14 | Seat management + admin export: getAdminSeats, grantAdminRole, revokeAdminRole, exportAllUserData server fns; /admin/seats role management UI, /admin/export full platform CSV/JSON download | `codewise.functions.ts`, `admin.seats.tsx` (new), `admin.export.tsx` (new) |
| 15 | Curriculum mapping: curriculum_mappings table migration (SPPU + NPTEL seed data), getCurriculumMappings/upsertCurriculumMapping server fns, /admin/curriculum inline-edit UI | `codewise.functions.ts`, `admin.curriculum.tsx` (new), `supabase/migrations/*_curriculum_mappings.sql` (new) |
| 16 | Blog "Explore": static blog posts lib, /explore list page (SEO meta, card grid), /explore/$slug detail page (article layout, CTA), added Explore link to homepage footer | `blog-posts.ts` (new), `explore.tsx` (new), `explore.$slug.tsx` (new), `index.tsx` |
| 17 | Nav redesign: replaced left sidebar with sticky top nav bar (centered links + user dropdown), mobile hamburger sheet, removed compact SiteFooter, added Explore to global footer | `route.tsx`, `site-footer.tsx` |
| 18 | Perf: React Query caching (staleTime/gcTime) on all 11 queries, lazy-loaded knowledge-graph (d3), Skeleton loading on dashboard + practice + submission detail | `dashboard.tsx`, `practice.tsx`, `settings.tsx`, `learn.$slug.tsx`, `submission.$submissionId.tsx`, `s.$submissionId.tsx`, `admin.dashboard.tsx`, `admin.seats.tsx`, `admin.export.tsx`, `admin.curriculum.tsx`, `settings.export.tsx` |
| 19 | Fix explore routing: explore.tsx converted to layout with Outlet (child detail routes now render), detail page stripped of duplicate chrome | `explore.tsx`, `explore.$slug.tsx` |
| 20 | Fix billing crash: useSubscription realtime channel collision with unique channel name + useRef cleanup | `use-subscription.ts` |
| 21 | Free tier 50/50/50: rename roadmapsPerDay→problemsPerDay, update pricing/billing/entitlements copy | `entitlements.server.ts`, `codewise.functions.ts`, `pricing.tsx`, `billing.tsx` |
| 22 | Free tier adjustments: problems 25/day, code runs 100/day, update pricing/billing copy | `entitlements.server.ts`, `pricing.tsx`, `billing.tsx` |
| 23 | Pro Yearly pricing: $199/yr with ~~$240~~ strikethrough + Save 17% badge, removed subtitle | `pricing.tsx` |
| 24 | Admin Paddle price update: updateProYearlyPrice server fn (admin-gated), /admin/update-price page, local script (requires Cloud secrets) | `billing.functions.ts`, `admin.update-price.tsx` (new), `scripts/update-yearly-price.ts` (new) |
| 25 | Playwright E2E: 18 route tests, 0 errors | — |
| 26 | Markdown rendering: install react-markdown, create `<Markdown>` wrapper, apply to review/submission/practice/dashboard AI output | `markdown.tsx` (new), `review.tsx`, `submission.$submissionId.tsx`, `s.$submissionId.tsx`, `practice.tsx`, `dashboard.tsx` |
| 27 | Em-dash purge (61→0): replace all em-dashes across 20 files, add content style guidelines to SYSTEM_PROMPT and handoff doc | 20 files across `src/` |
| 28 | AI retry logic: 3-attempt retry on JSON parse failure in reviewCode + generatePractice, review_issues error logging | `codewise.functions.ts` |
| 29 | Light mode beta warning: conditional amber badge in settings when theme=light | `settings.tsx` |
| 30 | Content style guidelines: added to handoff doc (Section 11.1) | `CODEWISE_HANDOFF_OPENCODE.md` |
| 31 | AI model fix: `google/gemini-3-flash-preview` → `google/gemini-3-flash` (wrong model name was causing 400) | `codewise.functions.ts`, `eval.ts` |
| 32 | JSON extraction helper `extractJson()`: strips markdown fences + extra text from AI responses | `codewise.functions.ts` |
| 33 | Schema tolerance: `.passthrough()` + `.default()` on ReviewResponseSchema | `codewise.functions.ts` |
| 34 | Gateway header fix: added `Lovable-API-Key` (caused 400, reverted), removed `response_format` (reverted) | `codewise.functions.ts` |
| 35 | Debug logging: show raw AI content + HTTP status in error messages | `codewise.functions.ts` |
| 36 | Model switch: `google/gemini-2.5-flash` → `openai/gpt-5-mini`, explicit JSON example in system prompt | `codewise.functions.ts`, `eval.ts` |
| 37 | Code-run fix: bypass quota (CHECK constraint missing `code_run`), add migration, restore quota after migration applied | `code-exec.functions.ts`, `supabase/migrations/*_add_code_run_kind.sql` (new) |
| 38 | Admin client centralization: 7 files now use `supabaseAdmin` from `client.server.ts` instead of duplicate singletons | `codewise.functions.ts`, `billing.functions.ts`, `entitlements.server.ts`, `og.$submissionId.ts`, `webhook.ts` |
| 39 | Run button on review page: code execution + output display, Zod validation on payments.functions.ts | `review.tsx`, `payments.functions.ts` |
| 40 | Update handoff doc: session tracker 25-39, mark completed items, update AI model ref | `CODEWISE_HANDOFF_OPENCODE.md` |
| 41 | Revert payments.functions.ts Zod validation per request | `payments.functions.ts` |
| 42 | Checkout success toast on landing page: detect ?checkout=success param, show Sonner toast, clean URL | `index.tsx` |
| 43 | Phase A+B+C combined: Admin foundation (nav links, route guards, isAdmin helper), dynamic config (app_config table, getPlanQuotas from DB, Site Settings page), blog CMS (blog_posts table, CRUD server fns, Blog Posts admin page, explore routes rewired to DB) | `use-auth.ts`, `route.tsx`, 5 admin route files, `codewise.functions.ts`, `billing.functions.ts`, `entitlements.server.ts`, `code-exec.functions.ts`, `blog-posts.ts`, `explore.tsx`, `explore.$slug.tsx`, `admin.settings.tsx` (new), `admin.blog.tsx` (new), `supabase/migrations/*_app_config.sql` (new), `supabase/migrations/*_blog_posts.sql` (new) |
| 44 | Migrations deployed, handoff doc updated, gitnexus config | `CODEWISE_HANDOFF_OPENCODE.md`, `opencode.json` |
| 45 | Plausible analytics: script in `<head>`, AnalyticsTracker component for SPA pageviews via router.subscribe | `__root.tsx`, `analytics-tracker.tsx` (new), `.env` |
| 46 | Lovable sync: pull security migrations (RLS hardening, curriculum_mappings table), gitnexus reindex (1807 nodes, 2902 edges), update documentation | `types.ts` (auto), `routeTree.gen.ts` (auto), 2 new migration files |
| 47 | User study scaffolding: consent banner (localStorage once-only), user_consent table + RLS, research_events table with indexes, getUserConsent/setUserConsent/recordResearchEvent/exportResearchData server fns, ConsentBanner + useTelemetry components, /admin/research route with stats + CSV/JSON export, research disclosure in Privacy, consent toggle in Settings | `consent-banner.tsx` (new), `use-telemetry.ts` (new), `admin.research.tsx` (new), `codewise.functions.ts`, `route.tsx`, `review.tsx`, `practice.tsx`, `settings.tsx`, `privacy.tsx`, `supabase/migrations/*_user_consent.sql` (new), `supabase/migrations/*_research_events.sql` (new) |
| 48 | UX improvements: consent once-only via localStorage, dashboard limit to 5 reviews + View more, practice 4-language selector (generate + editor), custom CodeMirror themes (dark + light matching site design), avatar support (avatar_url column, avatars storage bucket, AvatarUpload in Settings, avatar in nav replacing email, display name in dropdown) | `codemirror-themes.ts` (new), `consent-banner.tsx`, `dashboard.tsx`, `practice.tsx`, `review.tsx`, `route.tsx`, `settings.tsx`, `use-auth.ts`, `account.functions.ts`, `codewise.functions.ts`, `supabase/migrations/*_avatars.sql` (new) |
| 49 | UX polish: admin links moved to user dropdown (Dashboard + Billing & Limits), avatar size +14%, editor settings popover (Font Size 12-22px + 12 themes: Monokai/Github/Tomorrow/Kuroir/Twilight/Dracula/Xcode/TextMate/Solarized Dark/Solarized Light/Terminal/Eclipse), reset code + fullscreen buttons on editor, knowledge-graph light mode (20+ color swaps) | `editor-settings.tsx` (new), `codemirror-themes.ts`, `knowledge-graph.tsx`, `route.tsx`, `review.tsx`, `practice.tsx` |
| 50 | Nav rebalance: moved Settings & Billing from NAV_ITEMS into profile dropdown for all users, removed admin Dashboard + Billing & Limits from dropdown, added single Admin link (Shield icon → /admin/dashboard) between Settings and Billing; Editor theme overhaul: removed Kuroir + Terminal (12→10 themes), added syntax highlighting via HighlightStyle to fix "background-only changes" bug — all 10 themes now apply proper token colors; Public header Dashboard links added to landing page and explore page headers, auth-aware (→ /dashboard if logged in, → /login if not) | `route.tsx`, `codemirror-themes.ts`, `index.tsx`, `explore.tsx` |
| 51 | Design consistency: pricing page beta badge, replace inline footers with `<SiteFooter />` on landing/explore/pricing/legal/auth pages, normalize title separators (period → pipe) | `pricing.tsx`, `index.tsx`, `explore.tsx`, `terms.tsx`, `refunds.tsx`, `privacy.tsx`, `login.tsx`, `signup.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `practice.tsx`, `review.tsx`, `dashboard.tsx`, `submission.$submissionId.tsx`, `admin.research.tsx`, `learn.$slug.tsx`, `site-footer.tsx` |
| 52 | Legal page navigation: add auth-aware header to terms/refunds/privacy pages (logo + Dashboard + Pricing + Get started CTA) + SiteFooter | `terms.tsx`, `refunds.tsx`, `privacy.tsx` |
| 53 | Topic education content: 20 static TopicEducation objects (description, overview, operations, commonPatterns, whenToUse, whenToAvoid, maangFrequency, prerequisites) embedded in learn.$slug.tsx — no DB migration needed | `learn.$slug.tsx` (rewrite from 279 → 560 lines) |
| 54 | /learn/$slug educational rewrite: replaced generic benefit cards with concept overview, operations complexity table, common patterns with cross-links, MAANG frequency badge, prerequisites with nav links, when-to-use vs when-to-avoid | `learn.$slug.tsx` |
| 55 | Topic selection in practice: dropdown to choose topic instead of auto-weakest; URL param support `/practice?topic=arrays`; "Practice This Topic" links from learn pages | `practice.tsx` |
| 56 | First-run onboarding modal: 3-step dialog on empty dashboard, localStorage dismissed flag, "Skip tour" button | `dashboard.tsx`, `onboarding-modal.tsx` (new) |
| 57 | Navigation audit: verify all cross-page links, ensure SiteFooter on all pages, mobile hamburger parity with desktop nav | `site-footer.tsx` (verify, no major changes expected) |

**Credentials:** `vidhantomar17082004@gmail.com` / `Jaatdevta@123`
**Paddle test card:** `4242 4242 4242 4242`, CVC `123`, any future expiry

**Manual actions pending (user):**
- Verify Paddle identity (Payments tab in Lovable) before accepting real payments
- Run Supabase migrations not yet applied: `20260518000002_user_consent.sql`, `20260518000003_research_events.sql`, `20260518000004_avatars.sql`
- Add `VITE_PLAUSIBLE_DOMAIN` as Lovable Cloud secret for production analytics
- Create `avatars` storage bucket in Supabase Dashboard if the SQL migration doesn't auto-create it (set public = true, 5MB limit, allowed MIME: image/png,image/jpeg,image/webp,image/gif)

---

## 1. What changed vs the original plan

The original document described a Next.js + Python FastAPI + Prisma + DeepSeek stack. The MVP that was actually built collapses that into one isomorphic TanStack Start app:

| Layer              | Originally planned        | Actually built                                       |
| ------------------ | ------------------------- | ---------------------------------------------------- |
| Frontend framework | Next.js (App Router)      | TanStack Start v1 (React 19, Vite 7)                 |
| Server logic       | Python FastAPI backend    | TanStack createServerFn (TypeScript)                 |
| ORM / DB layer     | Prisma + Postgres         | Supabase JS client (RLS-enforced)                    |
| AI provider        | DeepSeek API              | Lovable AI Gateway → openai/gpt-5-mini   |
| Hosting (frontend) | Lovable Pro               | Lovable (Cloudflare Workers via vite-plugin)         |
| Hosting (backend)  | Railway / VPS for FastAPI | Same Worker — no separate backend                    |
| Auth               | OAuth (Google, GitHub)    | Supabase Auth — email + password + Google OAuth    |
| Payments           | Stripe / Razorpay         | Paddle (merchant of record, via Lovable Gateway)     |
| Editor             | CodeMirror 6              | CodeMirror 6 (kept as planned)                       |
| Knowledge tracing  | Full BKT model in Python  | BKT-lite update inside reviewCode server fn          |

Why the change: collapsing frontend + backend into TanStack Start removes a deploy target, removes CORS, removes the Prisma migration story, and lets all iteration (AI prompts, DB queries) happen in the same TypeScript file.

---

## 2. Current tech stack (as deployed)

| Layer              | Technology                                         | Notes                                                             |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------- |
| Framework          | TanStack Start v1.167                              | File-based routing (src/routes/), SSR on Cloudflare Workers       |
| UI runtime         | React 19.2 + TypeScript 5.8 (strict)               | No React Router DOM — TanStack Router only                        |
| Build tool         | Vite 7.3 + @cloudflare/vite-plugin 1.25            | Worker build via tanstackStart.server.entry override              |
| Styling            | Tailwind CSS v4.2 (CSS-first)                      | Tokens in src/styles.css (oklch); no tailwind.config.js           |
| Components         | shadcn/ui on Radix primitives                      | Pre-generated in src/components/ui/\*                             |
| Typography         | Fraunces (display) + Inter (body) + JetBrains Mono | Anthropic-style; defined in src/styles.css                        |
| Data fetching      | TanStack React Query 5.83                          | queryClient lives at \_\_root.tsx                                 |
| Forms / validation | react-hook-form 7 + zod 3                          | Zod also used to validate server-fn inputs                        |
| Server logic       | createServerFn (@tanstack/react-start)             | All AI + DB writes go through src/lib/codewise.functions.ts       |
| Auth               | Supabase Auth (email + password)                   | Session bearer attached via attachSupabaseAuth middleware         |
| Database           | Supabase Postgres (via Lovable Cloud)              | RLS on every user-data table                                      |
| AI                 | Lovable AI Gateway                                 | Model: openai/gpt-5-mini                               |
| Code editor        | CodeMirror 6 (@uiw/react-codemirror)               | Python, JavaScript, Java, C++ language packs                      |
| Charts             | Recharts 2.15                                      | Only imported where needed (dashboard mastery bars)               |
| Toasts             | Sonner 2.0                                         | Used for login/signup/review feedback                             |
| Hosting            | Lovable (Cloudflare Workers)                       | Preview + published from same repo, no manual deploy      |
| Analytics          | Plausible                                          | Privacy-first, cookie-less, SPA pageview tracking         |

---

## 3. Repository layout (actual)

The originally documented file tree (codewise/src/app + backend/) does not exist. The real layout:

```
src/
├── routes/
│   ├── __root.tsx                 # Root layout, head meta, error boundary, AuthSync
│   ├── index.tsx                  # Public landing page
│   ├── login.tsx                  # Email + password login + Google OAuth
│   ├── signup.tsx                 # Email + password signup + Google OAuth
│   ├── forgot-password.tsx        # Reset password email form
│   ├── reset-password.tsx         # Set new password after recovery link
│   ├── pricing.tsx                # Paddle pricing page ($20/mo, $112/yr)
│   ├── terms.tsx                  # Terms & Conditions (Paddle requirement)
│   ├── refunds.tsx                # Refund Policy (Paddle requirement)
│   ├── privacy.tsx                # Privacy Notice (Paddle requirement)
  │   ├── learn.$slug.tsx            # Educational topic page: concept overview, operations table, patterns, MAANG frequency, prerequisites, when-to-use/avoid
  │   ├── s.$submissionId.tsx        # Share-a-review public page
  │   ├── auth/
  │   │   └── callback.tsx           # OAuth post-redirect handler
  │   ├── api/public/
  │   │   ├── og.$submissionId.ts    # Dynamic OG image SVG route
  │   │   └── payments/
  │   │       └── webhook.ts         # Paddle webhook receiver
  │   └── _authenticated/
  │       ├── route.tsx              # Pathless layout: sidebar + client-side auth gate
  │       ├── dashboard.tsx          # Stats, topic mastery, recent reviews, knowledge graph
  │       ├── review.tsx             # Code editor -> reviewCode (quota-gated)
  │       ├── practice.tsx           # generatePractice (quota-gated) + listPractice
  │       ├── submission.$submissionId.tsx  # Submission detail + review issues
  │       ├── settings.export.tsx    # User data export (JSON/CSV)
  │       └── admin.dashboard.tsx    # Admin dashboard: all users, stats, subscriptions
  │       └── admin.seats.tsx        # Seat management: grant/revoke admin roles
  │       └── admin.export.tsx       # Admin data export: all users JSON/CSV
  │       └── admin.curriculum.tsx   # SPPU/NPTEL curriculum mapping (inline edit)
├── lib/
  │   ├── codewise.functions.ts      # Server fns: reviewCode, getDashboard, getSubmission, generatePractice, listPractice, getEntitlements, getPublicSubmission, getTopicBySlug, exportUserData, getAdminDashboard, getAdminSeats, grantAdminRole, revokeAdminRole, exportAllUserData, getCurriculumMappings, upsertCurriculumMapping
│   ├── billing.functions.ts       # Server fn: cancelSubscription, getCustomerPortalUrl
│   ├── entitlements.server.ts     # getUserPlan, consumeQuota, readUsage, PLAN_QUOTAS
│   ├── paddle.server.ts           # Paddle SDK init, webhook verify, gateway fetch
│   ├── paddle.ts                  # Client-side Paddle checkout helpers
│   ├── payments.functions.ts      # Thin re-export for route access
│   ├── error-capture.ts           # globalThis error capture for SSR
│   ├── error-page.ts              # Dependency-free 500 fallback
│   └── utils.ts                   # cn() shadcn helper
├── hooks/
│   ├── use-auth.ts                # Session listener (onAuthStateChange + getSession)
│   ├── use-subscription.ts        # Client hook: plan, status, pastDue, quotas
│   ├── use-paddle-checkout.ts     # Paddle overlay checkout trigger
│   └── use-mobile.tsx
├── components/
│   ├── ui/                        # shadcn primitives (button, input, dialog, ...)
│   └── PaymentTestModeBanner.tsx  # Paddle test mode indicator
├── integrations/
│   ├── supabase/                  # Auto-generated by Lovable — DO NOT EDIT
│   └── lovable/
│       └── index.ts               # Lovable Cloud Auth OAuth bridge — DO NOT EDIT
├── supabase/
│   └── migrations/                # SQL migrations: tables, RLS, SECURITY DEFINER fns, seed data
├── scripts/
│   ├── eval.ts                    # Eval harness: CSV corpus → AI gateway → metrics
│   └── corpus/
│       └── labelled-errors.csv    # Sample labelled buggy-code dataset
├── styles.css                     # Tailwind v4 tokens + font imports
├── start.ts                       # createStart() — registers errorMiddleware + attachSupabaseAuth
├── server.ts                      # Worker entry with lazy import + h3 normalization
└── router.tsx                     # createRouter + defaultErrorComponent
```

---

## 4. Database schema (live in Supabase)

Six tables in the public schema. RLS is enabled on all user-scoped tables; policies scope rows to `auth.uid()`. A `handle_new_user` trigger inserts a profiles row when a new auth user is created.

### 4.1 profiles

| Column       | Type        | Notes                                                            |
| ------------ | ----------- | ---------------------------------------------------------------- |
| id           | uuid (PK)   | References auth.users(id); set by trigger                        |
| display_name | text        | Defaults to display_name from signup metadata, else email prefix |
| created_at   | timestamptz | Default now()                                                    |

### 4.2 topics

| Column      | Type      | Notes                                                     |
| ----------- | --------- | --------------------------------------------------------- |
| slug        | text (PK) | 20 DSA slugs: arrays, hashing, recursion, dp, graphs, ... |
| name        | text      | Display name                                              |
| category    | text      | Grouping (data-structures, algorithms, paradigms...)      |
| description | text      | Used as context when generating practice problems         |

### 4.3 submissions

| Column     | Type        | Notes                                               |
| ---------- | ----------- | --------------------------------------------------- |
| id         | uuid (PK)   |                                                     |
| user_id    | uuid        | auth.users(id); enforced by RLS                     |
| language   | text        | python \| javascript \| java \| cpp                 |
| code       | text        | Up to 20,000 chars (validated by Zod)               |
| summary    | text        | AI-generated one-paragraph review                   |
| concepts   | text[]      | Touched topic slugs (filtered to VALID_TOPIC_SLUGS) |
| created_at | timestamptz |                                                     |

### 4.4 review_issues

| Column        | Type      | Notes                                         |
| ------------- | --------- | --------------------------------------------- |
| id            | uuid (PK) |                                               |
| submission_id | uuid      | FK -> submissions.id                          |
| user_id       | uuid      |                                               |
| line          | int       | Nullable line number                          |
| severity      | text      | error \| warning \| info                      |
| concept_slug  | text      | FK-style; validated against VALID_TOPIC_SLUGS |
| title         | text      |                                               |
| explanation   | text      |                                               |
| fix_hint      | text      | Pedagogical hint — never a full rewrite       |

### 4.5 progress (BKT-lite mastery)

| Column        | Type         | Notes                                                    |
| ------------- | ------------ | -------------------------------------------------------- |
| user_id       | uuid         | Composite PK with topic_slug                             |
| topic_slug    | text         | FK -> topics.slug                                        |
| mastery       | float [0..1] | Updated via m = m + alpha(signal - m), alpha = 0.35      |
| attempts      | int          | Incremented on every reviewCode call touching this topic |
| last_reviewed | timestamptz  |                                                          |

Signal rule (in `src/lib/codewise.functions.ts` -> `reviewCode`):

- bad > 0 -> signal = max(0, 0.5 - 0.15 \* bad)
- good > 0 -> signal = 0.95
- otherwise -> signal = 0.7 (neutral / no major issues)

### 4.6 practice_problems

| Column       | Type        | Notes                                               |
| ------------ | ----------- | --------------------------------------------------- |
| id           | uuid (PK)   |                                                     |
| user_id      | uuid        |                                                     |
| topic_slug   | text        | FK -> topics.slug; auto-picks weakest topic if null |
| title        | text        |                                                     |
| prompt       | text        | Markdown-friendly problem statement with examples   |
| starter_code | text        | Skeleton with TODO comments                         |
| language     | text        | python \| javascript \| java \| cpp                 |
| created_at   | timestamptz |                                                     |

### 4.7 subscriptions (Paddle)

| Column                    | Type        | Notes                                                  |
| ------------------------- | ----------- | ------------------------------------------------------ |
| id                        | uuid (PK)   |                                                        |
| user_id                   | uuid        | FK -> auth.users                                       |
| paddle_subscription_id    | text        | Paddle subscription ID                                 |
| paddle_customer_id        | text        | Paddle customer ID                                     |
| status                    | text        | active \| trialing \| past_due \| canceled             |
| current_period_end        | timestamptz | When the current billing period ends                   |
| cancel_at_period_end      | boolean     | Paddle-side cancel flag                                |
| environment               | text        | sandbox \| live                                        |
| created_at / updated_at   | timestamptz |                                                        |

### 4.8 usage_counters (quota tracking)

| Column     | Type      | Notes                                                        |
| ---------- | --------- | ------------------------------------------------------------ |
| id         | uuid (PK) |                                                              |
| user_id    | uuid      |                                                              |
| kind       | text      | review \| roadmap                                            |
| period_key | text      | YYYY-MM or YYYY-MM-DD                                        |
| counter    | int       | Incremented atomically by `consume_quota` SECURITY DEFINER fn |

**SQL functions (SECURITY DEFINER):** `consume_quota(p_user_id, p_kind, p_limit, p_period_key)` — atomic increment with cap check; `get_usage(p_user_id, p_kind, p_period_key)` — reads current counter. Both have `REVOKE EXECUTE ON FUNCTION FROM PUBLIC`; access granted only via service role.

### 4.9 user_roles (admin role management)

| Column     | Type      | Notes                                    |
| ---------- | --------- | ---------------------------------------- |
| id         | uuid (PK) |                                          |
| user_id    | uuid      | FK -> auth.users                         |
| role       | text      | CHECK (role IN ('admin'))                |
| created_at | timestamptz |                                        |
|            |           | UNIQUE (user_id, role)                  |

**SQL function:** `has_role(p_user_id uuid, p_role text)` — SECURITY DEFINER, returns boolean. Callable by `authenticated` users (used client-side for admin nav visibility).

### 4.10 app_config (dynamic configuration)

| Column     | Type      | Notes                                    |
| ---------- | --------- | ---------------------------------------- |
| key        | text (PK) | Config key (e.g. plan_quota_free_reviews) |
| value      | text      | Config value as string                   |
| updated_at | timestamptz |                                        |

RLS enabled. Access via `supabaseAdmin` (service role) in admin-gated server functions. Keys: `plan_quota_free_*`, `plan_quota_pro_*`, `plan_price_pro_monthly`, `plan_price_pro_yearly`.

### 4.11 blog_posts (blog CMS)

| Column     | Type      | Notes                                    |
| ---------- | --------- | ---------------------------------------- |
| id         | uuid (PK) |                                          |
| slug       | text      | UNIQUE, URL-safe identifier              |
| title      | text      |                                          |
| excerpt    | text      | Card preview text                        |
| body       | text      | JSON array of paragraph strings          |
| tags       | text[]    |                                          |
| author     | text      | Default "CodeWise"                       |
| published  | boolean   | Only published posts show on /explore    |
| created_at | timestamptz |                                        |
| updated_at | timestamptz |                                        |

RLS enabled. Public read via `supabaseAdmin` in `getAllBlogPosts`/`getBlogPostBySlug` server fns. Admin CRUD via admin-gated server fns.

### 4.12 curriculum_mappings (SPPU/NPTEL alignment)

| Column       | Type      | Notes                                    |
| ------------ | --------- | ---------------------------------------- |
| topic_slug   | text (PK) | FK-style to topics.slug                  |
| sppu_course  | text      | SPPU course name                         |
| sppu_module  | text      | SPPU module name                         |
| nptel_course | text      | NPTEL course name                        |
| nptel_module | text      | NPTEL module name                        |
| year_semester | text     | e.g. "SE Sem 3"                          |
| updated_at   | timestamptz |                                        |

RLS enabled, no policies. Access via `supabaseAdmin` only.

### 4.13 user_consent (research opt-in)

| Column        | Type        | Notes                                    |
| ------------- | ----------- | ---------------------------------------- |
| user_id       | uuid (PK)   | References auth.users(id)                |
| consent_given | boolean     | Default false. User opts in via banner or Settings. |
| consented_at  | timestamptz | When consent was set                     |
| consent_version | text      | "1.0"                                    |

RLS: users can read own row. Writes via supabaseAdmin.

### 4.14 research_events (anonymized telemetry)

| Column     | Type      | Notes                                    |
| ---------- | --------- | ---------------------------------------- |
| id         | uuid (PK) | gen_random_uuid()                        |
| user_id    | uuid      | References auth.users(id)                |
| event_type | text      | review_submitted, practice_generated, practice_solved |
| payload    | jsonb     | { language, concept_count, issue_count, topic, severity } |
| created_at | timestamptz |                                        |

Indexes on user_id, event_type, created_at. No direct user access — all via supabaseAdmin.

### 4.15 profiles.avatar_url (new column)

Added via `20260518000004_avatars.sql`. Nullable text. Set by `updateProfileAvatar` server fn after client uploads to `avatars` storage bucket.

---

## 5. Server functions (as deployed)

All live in `src/lib/codewise.functions.ts`. Every function is guarded by `requireSupabaseAuth` and runs on Cloudflare Workers.

| Server fn        | Method | What it does                                                                                                                                                                    |
| ---------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reviewCode       | POST   | Sends code to Lovable AI Gateway with the CodeWise pedagogical system prompt, parses Zod-validated JSON, inserts into submissions + review_issues, updates progress (BKT-lite). Now quota-gated via `consumeQuota`. Returns `upgradeRequired: true` when free cap hit. |
| getDashboard     | GET    | Parallel reads: last 10 submissions, all progress rows for user, full topics table. Feeds dashboard.tsx.                                                                        |
| getSubmission    | GET    | Single submission + its review_issues, for a future detail view.                                                                                                                |
| generatePractice | POST   | Picks weakest topic if none given, asks Gemini for a problem (title + prompt + starter_code), inserts into practice_problems. Now quota-gated via `consumeQuota`.               |
| listPractice     | GET    | Last 20 practice problems for the current user.                                                                                                                                 |
| getEntitlements  | GET    | (in `codewise.functions.ts`) Returns plan, status, pastDue, quotas, and usage counters for the billing UI.                                                                      |
| getAppConfig     | GET    | Admin-gated. Returns all app_config key-value pairs. Used by admin.settings.tsx.                                                                                                |
| setAppConfig     | POST   | Admin-gated. Upserts config entries. Invalidates quota cache via `refreshPlanQuotas()`.                                                                                        |
| getAllBlogPosts     | GET | Public. Returns all published blog posts from `blog_posts` table. Used by explore.tsx.                                                                                         |
| getBlogPostBySlug   | POST | Public. Returns a single published post by slug. Used by explore.$slug.tsx.                                                                                                    |
| listAllBlogPostsAdmin | GET | Admin-gated. Returns all blog posts (including drafts). Used by admin.blog.tsx.                                                                                                |
| createBlogPost    | POST   | Admin-gated. Inserts a new blog post.                                                                                                                                          |
| updateBlogPost    | POST   | Admin-gated. Updates an existing blog post by ID.                                                                                                                              |
| deleteBlogPost    | POST   | Admin-gated. Deletes a blog post by ID.                                                                                                                                        |
| getUserConsent    | GET    | Returns current user's consent record (consent_given, consented_at, consent_version). Used by consent banner + settings.                                                       |
| setUserConsent    | POST   | Upserts consent record via supabaseAdmin. Triggered by consent banner Yes/No or Settings toggle.                                                                              |
| recordResearchEvent | POST | Checks consent, inserts into research_events via supabaseAdmin. Best-effort, returns recorded:false on error. Fire-and-forget from client.                                    |
| exportResearchData | GET  | Admin-gated. Returns anonymized event counts (event_type, language, severity, concept_count breakdowns) + event list (type + timestamp only, no user data).                    |
| updateProfileAvatar | POST | Updates profiles.avatar_url via supabaseAdmin. Called after client-side Supabase Storage upload completes.                                                                    |

**Billing functions** (`src/lib/billing.functions.ts`):

| Server fn             | Method | What it does                                                                                           |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| cancelSubscription    | POST   | Cancels active sub in Paddle at next billing period; sets `current_period_end = now + 7d` for grace.   |
| getCustomerPortalUrl  | POST   | Returns a Paddle customer portal session URL for updating payment method / viewing invoices.           |

---

## 6. What's built vs what's left

### 6.1 Done

- TanStack Start scaffold, Cloudflare Workers SSR, error middleware, root error boundary
- Tailwind v4 design system: Fraunces serif + Inter body, oklch tokens, dark-leaning theme
- Public landing page (/) with hero, mock review preview, feature grid, CTA
- Auth: email + password signup & login (Supabase), session bearer attached to every serverFn
- Pathless \_authenticated layout with sidebar + sign-out + client-side session check
- Dashboard with stats, topic mastery bars, recent reviews, CTA to /practice
- Code review flow: CodeMirror editor -> reviewCode -> AI returns concepts + issues -> persisted + mastery updated
- Practice flow: generatePractice picks weakest topic, AI returns problem + starter code, stored & listed
- RLS on submissions / review_issues / progress / practice_problems; profiles auto-created via trigger
- Lovable AI Gateway integrated; LOVABLE_API_KEY managed as Lovable Cloud secret
- Paddle payments: pricing page ($20/mo, $112/yr), overlay checkout, webhook handler, subscriptions tracking
- Freemium gating: Free tier capped at 5 reviews/month + 1 roadmap/day; Pro at 1500/month + 15/day
- Usage counters via SECURITY DEFINER SQL functions (`consume_quota`, `get_usage`) with public EXECUTE revoked
- Legal pages: /terms, /refunds, /privacy (Paddle merchant-of-record requirement)
- Cancellation grace period: 7 days from cancel click, enforced in `cancelSubscription` server fn
- Navigation redesign: top sticky nav bar (centered links), mobile hamburger sheet, user dropdown, global site footer
- Performance: React Query caching (staleTime/gcTime tuned per query), knowledge-graph lazy-loaded (d3 code-split), Skeleton loading states on key pages
- Free tier limits: 50 reviews/month, 25 problems/day, 100 code runs/day
- Pro Yearly pricing: $199/yr with ~~$240~~ strikethrough + Save 17% badge
- Paddle price update admin tool: /admin/update-price
- Admin foundation: Admin nav link (visible only to admin users), beforeLoad route guards on all 5 admin routes, shared isAdmin() helper, has_role RPC for client-side admin detection
- Dynamic config: app_config DB table, getPlanQuotas() reads from DB with module-level cache, admin.settings.tsx page with editable free/pro limits and pricing display
- Blog CMS: blog_posts DB table, full CRUD server functions, admin.blog.tsx management page (create/edit/delete/publish toggle), explore routes rewired to DB
- Plausible analytics: script in RootShell head, AnalyticsTracker component for SPA pageview tracking on route changes
- Security hardening: Lovable applied RLS on app_config/blog_posts, revoked sensitive SECURITY DEFINER function execute from non-service roles, dropped self-referential user_roles policies

Previously listed gaps now completed:
- ~~Billing page UI~~ → Done: /billing with plan card, upgrade CTA, usage copy
- ~~Blog "Explore"~~ → Done: /explore + /explore/$slug with 5 posts

### 6.2 Not yet built (remaining polish items)

- Avatar migration not yet run (manual): `supabase/migrations/20260518000004_avatars.sql`
- Analytics dashboard (Plausible account setup for viewing data) — manual
- ICT paper submission (target April 2027)

### 6.3 Phase 9 — Info, Design & Navigation (IN PROGRESS)

| Sess. | Task | Status |
|-------|------|--------|
| 9.1 | Design consistency: pricing beta badge, `<SiteFooter />` on all pages, title separators | ✅ Done: Session 51 |
| 9.2 | Legal page nav: auth-aware header on terms/refunds/privacy | ✅ Done: Session 52 |
| 9.3 | Topic education content: static TopicEducation objects embedded in learn.$slug.tsx | ✅ Done: Session 53 |
| 9.4 | /learn/$slug educational rewrite: concept overview, operations table, patterns, MAANG frequency, prerequisites, when-to-use/avoid | ✅ Done: Session 54 |
| 9.5 | Topic selection dropdown on /practice + URL param support | ⬜ Next session |
| 9.6 | First-run onboarding modal on empty dashboard | ⬜ |
| 9.7 | Navigation audit: cross-page link verification, mobile parity | ✅ Done: Sessions 51-52 |

**No manual actions needed for remaining Phase 9 items.**

Previously listed gaps now completed:
- ~~Stripe payment~~ → Done: Paddle via Lovable Gateway
- ~~Password reset flow~~ → Done: /forgot-password + /reset-password
- ~~Submission detail page~~ → Done: /_authenticated/submission/$submissionId
- ~~Knowledge graph visualization~~ → Done: d3-force with pan/zoom, 20 topics
- ~~Share-your-review viral loop~~ → Done: /s/$id route + OG image
- ~~SEO landing pages per topic~~ → Done: /learn/$slug (Phase 4)
- ~~College / team licenses~~ → Done: user_roles table + admin dashboard (Phase 6)
- ~~Export user data~~ → Done: /settings/export + admin export (Phase 5 + 6)
- ~~CS curriculum mapping UI~~ → Done: /admin/curriculum with SPPU/NPTEL alignment (Phase 6)
- ~~Research corpus / eval harness~~ → Done: scripts/eval.ts with metrics (Phase 5)
- ~~AI model connectivity~~ → Done: `openai/gpt-5-mini`, works reliably with JSON schema
- ~~Code-run quota~~ → Done: DB migration applied, quota check restored
- ~~Em-dash cleanup~~ → Done: 0 em-dashes in source, content guidelines in system prompt
- ~~Markdown rendering for AI output~~ → Done: react-markdown wrapper applied to all AI text
- ~~Duplicate admin clients~~ → Done: centralized to supabaseAdmin from client.server.ts (7 files)
- ~~Run button on review page~~ → Done: code execution with output display

---

## 7. Next session: Phase 9 remaining items

Two features left to build. Order: smallest first.

### 7.1 Topic selection on /practice (Session 55)

**What:** Add a topic dropdown next to the language selector. Default is "Weakest Topic (auto)" — same behavior as today. User can explicitly pick any of the 20 topics. The `/learn/$slug` page's "Practice This Topic" button links to `/practice?topic=arrays`.

**opencode can do:**
- Read `src/routes/_authenticated/practice.tsx` to understand current generate flow
- Add a `<Select>` dropdown component listing all 20 topics grouped by category
- Pass `topic_slug` to `generatePractice()` when explicitly selected
- Support `?topic=arrays` URL search param in `beforeLoad`
- Wire the `/learn/$slug` page CTA to link `/practice?topic={slug}`

### 7.2 First-run onboarding modal (Session 56)

**What:** On first dashboard load (0 submissions), show a 3-step dialog using shadcn `<Dialog />`. Steps: 1) Submit your first code for AI review → link to `/review`, 2) Review feedback showing which CS concepts you're weak on, 3) Practice your weakest topic → link to `/practice`. Dismissed via localStorage flag (same pattern as consent banner). "Skip tour" button.

**opencode can do:**
- Create `src/components/onboarding-modal.tsx` with shadcn Dialog + 3 steps
- Import and render on `dashboard.tsx` when `submissions.length === 0`
- Use `localStorage.getItem('onboarding_dismissed')` to gate display
- Wire "Skip tour" and "×" close to set localStorage flag

### 7.3 Future: FSRS + Widget (see v1_markdown.md)

The `v1_markdown.md` file contains complete architecture specs for the two highest-leverage features:
- **FSRS Spaced Repetition Scheduler**: AI-graded DSR model replacing manual SM-2, with TypeScript implementation ready to integrate into `codewise.functions.ts`
- **Embeddable Free Code Review Widget**: Cloudflare Workers edge-computed token bucket, curiosity gap conversion UI, postMessage auto-resize iframe

These are spec'd at ~490 lines. Start there after Phase 9 completes.

---

## 8. opencode vs Cursor: Capability Map

| Task type                 | opencode can do        | opencode cannot do                     |
| ------------------------- | ---------------------- | -------------------------------------- |
| Edit/create source files  | Yes — edit/write tools | —                                      |
| TypeScript type-checking  | Yes — `npm run build`  | —                                      |
| Linting                   | Yes — `npm run lint`   | —                                      |
| Run dev server            | Yes — `npm run dev`    | Cannot see browser output              |
| Create DB migrations      | Yes — write SQL files  | Cannot run migrations against Supabase |
| Create new routes/pages   | Yes                    | Cannot visually verify layouts         |
| Git operations            | Yes                    | —                                      |
| Search codebase           | Yes — glob + grep      | —                                      |
| **GitNexus code intel**   | **Yes — impact/context/query** | —                              |
| Supabase dashboard config | No — manual step       | —                                      |
| Stripe dashboard config   | No — manual step       | —                                      |
| OAuth app registration    | No — manual step       | —                                      |
| Lovable Cloud secrets     | No — manual step       | —                                      |
| Visual QA / pixel check   | No                     | Cannot render UI                       |

### opencode workflow for this project (GitNexus-enhanced)

**Before any session:**
0. **Run** `gitnexus analyze` to ensure the knowledge graph is fresh (skip if index is up-to-date per `gitnexus status`)

**For each edit task:**
1. **Read** the target file to understand existing patterns
2. **Run** `gitnexus_impact` on the symbol you're about to change; warn the user if risk is HIGH/CRITICAL
3. **Run** `gitnexus_context` on the target symbol to see all callers, callees, and participating flows
4. **Edit** to implement changes
5. **Run** `npm run build` (or `npx tsc --noEmit`) to catch TypeScript errors
6. **Run** `npm run lint` to catch ESLint issues
7. **Iterate** — fix errors and re-check
8. User verifies UI changes manually in the browser

**Before committing:**
9. **Run** `gitnexus_detect_changes()` to verify only expected symbols and flows were affected

---

## 9. File-edit invariants (DO NOT EDIT)

These files are auto-generated by Lovable Cloud and should never be edited by opencode:

- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/client.server.ts`
- `src/integrations/supabase/auth-middleware.ts`
- `src/integrations/supabase/auth-attacher.ts`
- `src/integrations/supabase/types.ts`
- `src/integrations/lovable/index.ts` — Lovable's OAuth bridge to Supabase; deleting it breaks Google sign-in
- `src/routeTree.gen.ts`
- `.env` (Lovable may overwrite; add new vars carefully)
- `supabase/migrations/20260518001844_*` — Lovable security hardening migration (RLS, revoke execute)
- `supabase/migrations/20260518001930_*` — Lovable curriculum_mappings table migration

---

## 10. Environment & secrets

Already configured inside Lovable Cloud (no action needed on Lovable):

- `LOVABLE_API_KEY` — used by createServerFn handlers when calling the AI Gateway
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`

When running locally, mirror them in `.env` (Lovable also auto-generates the VITE\_\* variants):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   (server-only, never prefix with VITE_)
LOVABLE_API_KEY=...              (server-only)
PADDLE_SANDBOX_API_KEY=...       (server-only)
PADDLE_LIVE_API_KEY=...           (server-only)
PAYMENTS_SANDBOX_WEBHOOK_SECRET=... (server-only)
PAYMENTS_LIVE_WEBHOOK_SECRET=...  (server-only)
```

**Local development extra step:** After first clone or sync, install these packages (injected by Lovable at deploy time but must be installed locally for `tsc` to pass):

```bash
npm install @lovable.dev/cloud-auth-js@1.1.2 @paddle/paddle-node-sdk
```

---

## 11. Lovable Compatibility Rules

> These rules prevent the issues encountered during 17 May 2026 session. Open a new session by saying "next session" — opencode will read this section automatically.

| Rule | Why |
|------|-----|
| **Never delete** `src/integrations/lovable/` | Lovable's OAuth bridge to Supabase. `auth-helpers.ts` imports from it. Deleting it breaks Google sign-in. |
| **Install** `@lovable.dev/cloud-auth-js` after sync | Required locally for `tsc --noEmit` to pass. Lovable Cloud injects it at build time but it won't be in your local `node_modules` after a fresh clone. |
| **Wait for `onAuthStateChange` after auth mutations** | `supabase.auth.updateUser({ password })` resolves before the new session settles. If you `nav({ to: "/dashboard" })` immediately, the `_authenticated` layout's `beforeLoad` sees no session and redirects to `/login`. Always subscribe to `onAuthStateChange` and wait for a `SIGNED_IN` event with a non-null session before navigating to an authenticated route. |
| **Server functions: never expose raw DB errors** | Replace `error?.message ?? "DB error"` with a generic `"Something went wrong. Please try again."` and `console.error` the real error server-side. Lovable's security agent flags raw error exposure. |
| **Use explicit import paths for directory modules** | `@/integrations/lovable/index` not `@/integrations/lovable`. TanStack/Vite may fail to resolve directories as modules. Lovable will auto-fix this. |
| **`routeTree.gen.ts` auto-regenerates** | If you add/remove route files, the route tree is regenerated. Edit the route `.tsx` files, not this auto-generated file. |
| **Test via `https://happy-stack-maker.lovable.app/`** | After every push, verify changes on the live deployment. Dev server (`npm run dev`) runs locally but Lovable-specific features (OAuth bridge, Cloud Auth) only work in the deployed environment. |
| **Push → publish cycle** | Push to GitHub → user republishes on Lovable → test against live URL. Never assume local dev matches production for Lovable-integrated features. |
| **DO NOT EDIT Supabase integration files** | `client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, `types.ts` are auto-generated by Lovable Cloud. Changes will be overwritten or break production. |
| **Supabase session-race pattern** | After any auth mutation (`signIn`, `signUp`, `updateUser`, `setSession`), the session may not be immediately available. Use `supabase.auth.onAuthStateChange` with a fallback `getSession()` timeout (5s) before navigating. See `src/routes/reset-password.tsx` for the reference implementation. |
| **Paddle: never edit `paddle.server.ts` or `paddle.ts`** | These are Lovable-generated gateway wrappers. The Paddle SDK talks through `connector-gateway.lovable.dev/paddle`, not directly to Paddle's API. Changing the gateway URL or headers breaks checkout/webhooks. |
| **Paddle: instaleer `@paddle/paddle-node-sdk` na sync** | Zelfde patroon als `@lovable.dev/cloud-auth-js` — nodig voor `tsc --noEmit` lokaal. `npm install @paddle/paddle-node-sdk` |
| **Paddle: pricing = $20/mo, $112/yr** | Products in Paddle dashboard must match pricing page. If you change pricing, update BOTH Paddle dashboard AND `src/routes/pricing.tsx`. |
| **Paddle: test card** | `4242 4242 4242 4242`, CVC `123`, any future expiry, any name/ZIP. Test mode banner visible on overlay. |
| **Paddle: webhook is at `/api/public/payments/webhook`** | Must be configured in Paddle sandbox/live dashboard. Lovable auto-provisions this via the gateway. |
| **SQL: `SECURITY DEFINER` functions have revoked public EXECUTE** | `consume_quota` and `get_usage` in Supabase. Do not grant public EXECUTE — the Lovable security agent flags this. Access is via service role only in `entitlements.server.ts`. |

### Content Style Guidelines

> These rules keep the CodeWise brand voice professional and AI-agnostic.

| Rule | Why |
|------|-----|
| **Never use em dashes (—)** | Em dashes are the hallmark of AI-generated text. Replace with commas, semicolons, colons, or periods. In meta titles, use `|` pipe instead. |
| **Avoid filler phrases** | Words like "delve", "firstly", "secondly", "moreover", "furthermore", "consequently", "in conclusion" read as AI-generated fluff. Keep writing direct and concise. |
| **No flowery language** | Avoid poetic or overly descriptive language in AI outputs. The tone should be teaching-focused, direct, and professional — not literary. |
| **Use active voice** | Prefer "The function returns" over "The value is returned by the function". |
| **Keep AI outputs focused** | AI-generated summaries, explanations, and hints should be concise (1-3 sentences for issues, 1 paragraph for summaries). No preamble, no self-praise, no meta-commentary. |

---

## 12. Still-valid sections from the original plan

The following sections from the May 2026 plan remain accurate and do not need rewriting — refer to them for go-to-market, research, and revenue.

### 12.1 SEO keywords (unchanged)

| Keyword                         | Monthly volume | KD  |
| ------------------------------- | -------------- | --- |
| AI code reviewer for students   | 10K-15K        | 3   |
| AI code review agent            | 20K            | 5   |
| online exam proctoring          | 20K            | —   |
| Bayesian knowledge tracing tool | 1K-3K          | 2   |
| pedagogical code review         | 1K-5K          | 2   |

### 12.2 Revenue model (Year 1 — still the working hypothesis)

| Stream                    | Share | Notes                               |
| ------------------------- | ----- | ----------------------------------- |
| Free tier (10 reviews/mo) | 55%   | Lead-gen — not yet enforced in code |
| Premium 199/mo            | 25%   | Needs Stripe + quota table          |
| College license 99K/yr    | 15%   | Needs admin dashboard + seat mgmt   |
| Affiliate / ads           | 5%    | Out of MVP scope                    |

### 12.3 Research paper

Title: _CodeWise: A Pedagogical AI Code Reviewer with Bayesian Knowledge Tracing for Personalized CS Education_.
Target: IEEE ICNDIA-2027, AIT Pune. Submission window: April 2027.

The MVP already collects the data needed for the experimental section (submissions + review_issues + progress); what's missing is the labelled corpus and the user-study scaffolding (see section 6.2).

### 12.4 Post-launch roadmap

| Phase    | Timeline  | Features                                                            |
| -------- | --------- | ------------------------------------------------------------------- |
| MVP+1    | Month 1-2 | OAuth, password reset, payments, submission detail page             |
| Growth   | Month 3-5 | Knowledge graph viz, share-score viral loop, per-topic SEO pages    |
| B2B      | Month 6-7 | College licenses, admin dashboard, seat management, exports         |
| Research | Month 8   | Labelled corpus, eval harness, user-study data collection -> ICNDIA |

---

---

## 13. Master Timeline & Task Board for opencode

### 13.1 Original 9-Day Plan → Current Status Map

The original _CodeWise Full Plan Documentation_ described a 9-day build targeting Next.js + FastAPI. The MVP that shipped diverged significantly (see section 1). This table maps each planned day to what actually got built:

| Day | Phase          | Original Deliverable                               | Status                | Notes                                                                           |
| --- | -------------- | -------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| 1   | Foundation     | Next.js, Supabase, Prisma, NextAuth                | ✅ Done (differently) | Built with TanStack Start + Supabase JS client instead                          |
| 2   | Landing + Auth | SEO landing, OAuth flow, Dashboard shell           | ⚠️ Partial            | Landing exists; OAuth missing (email only); forgot/reset password missing       |
| 3   | AI Engine Core | FastAPI, tree-sitter, LLM reviewer, BKT            | ✅ Done (differently) | Lovable AI Gateway replaces FastAPI; BKT-lite in createServerFn; no tree-sitter |
| 4   | AI Refinement  | Supabase integration, DSA topic hierarchy, prompts | ✅ Done               | Topics table seeded; reviewCode prompts tuned; 20 DSA topic slugs               |
| 5   | Code Review UI | CodeMirror, language selector, results display     | ✅ Done               | review.tsx working end-to-end with 4 languages                                  |
| 6   | Dashboard      | Stats, mastery bars, knowledge graph               | ⚠️ Partial            | Stats + mastery done; **knowledge graph visualization missing**                 |
| 7   | Integration    | E2E integration, mobile, a11y, perf                | ⚠️ Partial            | Functional but unpolished: no full E2E test, no accessibility audit             |
| 8   | SEO + Content  | Blog, keywords, landing polish, paper outline      | ❌ Not started        | No blog, no per-topic SEO pages, no paper outline                               |
| 9   | Deploy         | Lovable deploy, domain, prod testing               | ✅ Done               | Preview deployed on Lovable Cloud (Cloudflare Workers)                          |

### 13.2 Phased Execution Plan

Each phase lists what opencode executes vs what requires manual user action. Sessions are estimated in typical opencode CLI interactions (roughly 1–3 hours per session, producing a PR-worth of code).

| #   | Phase                   | Sessions | Priority  | Depends On            |
| --- | ----------------------- | -------- | --------- | --------------------- |
| 1   | Auth & Access           | 2–3      | 🔴 High   | Nothing               |
| 2   | Monetization Foundation | 3–4      | 🔴 High   | Phase 1               |
| 3   | UI Completion           | 2–3      | 🟡 Medium | Nothing (parallel OK) |
| 4   | Growth & SEO            | 2–3      | 🟡 Medium | Nothing (parallel OK) |
| 5   | Research Scaffolding    | 2–3      | 🟢 Lower  | Nothing (parallel OK) |
| 6   | B2B & Admin             | 3–4      | 🟢 Lower  | Phase 2               |

**Total estimated sessions: 14–20**

### 13.3 Dependency Graph

```
Phase 1 (Auth)
    │
    └──> Phase 2 (Monetization) ──> Phase 6 (B2B)

Phase 3 (UI)         <── independent, can start anytime
Phase 4 (SEO)        <── independent, can start anytime
Phase 5 (Research)   <── independent, can start anytime
```

### 13.4 Session-by-Session Breakdown

#### Phase 1: Auth & Access (2–3 sessions)

| Sess. | Task                                                                                            | Files Touched                                                                                           | GitNexus Pre-Check                                                               | opencode Category |
| ----- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------- |
| 1.1   | Add Google OAuth callback route + helper to accept OAuth provider tokens                        | `src/routes/auth/callback.tsx` (new), `src/lib/auth-helpers.ts` (new, wraps Supabase `signInWithOAuth`) | `gitnexus_impact({target: "supabaseAuth"})` — check auth dependency chain       | Code              |
| 1.2   | Build forgot-password + reset-password pages with react-hook-form + zod validation              | `src/routes/forgot-password.tsx` (new), `src/routes/reset-password.tsx` (new)                           | `gitnexus_query({query: "password reset"})` — find existing password flow       | Code              |
| 1.3   | Wire Supabase `resetPasswordForEmail` + `updateUser`, add OAuth buttons to login + signup pages | `src/routes/login.tsx`, `src/routes/signup.tsx`                                                         | `gitnexus_context({name: "login"})` — see auth form callers/callees             | Code              |

**Manual user action required for Phase 1:**

- Enable Google OAuth provider in Supabase Dashboard (Authentication → Providers)
- Create Google Cloud Console OAuth 2.0 client with redirect URI matching the deployed callback URL
- Optional: enable Apple sign-in (requires Apple Developer account)

---

#### Phase 2: Monetization Foundation (3–4 sessions)

| Sess. | Task                                                                                                                                                  | Files Touched                                                                                    | GitNexus Pre-Check                                                                           | opencode Category |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ----------------- |
| 2.1   | Create `user_quotas` DB migration: table (user_id, reviews_used, period_start) + RLS. Add quota check guard in `reviewCode` before calling AI Gateway | `supabase/migrations/*_user_quotas.sql` (new), `src/lib/codewise.functions.ts`                   | `gitnexus_impact({target: "reviewCode"})` — check all callers of the review function         | Code + SQL        |
| 2.2   | Create Stripe webhook server route, create `subscriptions` table migration                                                                            | `src/routes/api/public/stripe-webhook.ts` (new), `supabase/migrations/*_subscriptions.sql` (new) | `gitnexus_context({name: "webhook"})` — see existing Paddle webhook pattern for consistency  | Code + SQL        |
| 2.3   | Build `/pricing` page with tier cards, Stripe Checkout redirect, and `/settings/billing` page showing current subscription                            | `src/routes/pricing.tsx` (new), `src/routes/_authenticated/settings.billing.tsx` (new)           | `gitnexus_impact({target: "pricing"})` — what links to pricing page                         | Code              |
| 2.4   | Wire "Upgrade to Pro" CTA on dashboard and review page when quota exhausted                                                                           | `src/routes/_authenticated/dashboard.tsx`, `src/routes/_authenticated/review.tsx`                | `gitnexus_impact({target: "getDashboard"})` — what depends on dashboard data                | Code              |

**Manual user action required for Phase 2:**

- Create Products & Prices in Stripe Dashboard (Free, Pro ₹199/mo, College ₹99K/yr)
- Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env` and Lovable Cloud secrets
- Configure Stripe webhook endpoint to point at deployed `/api/public/stripe-webhook`

---

#### Phase 3: UI Completion (2–3 sessions)

| Sess. | Task                                                                                                                                                                    | Files Touched                                                                         | GitNexus Pre-Check                                                                  | opencode Category |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------- |
| 3.1   | Create `/_authenticated/review.$submissionId.tsx` — split layout: code on left, issues list on right. Reuse existing `getSubmission` server fn                          | `src/routes/_authenticated/review.$submissionId.tsx` (new)                            | `gitnexus_context({name: "getSubmission"})` — check server fn contract              | Code              |
| 3.2   | Add clickable "View" button to each recent submission row on dashboard                                                                                                  | `src/routes/_authenticated/dashboard.tsx`                                             | ✅ Done                                                                             | ✅ Done            |
| 3.3   | Build `<KnowledgeGraph />` component: d3-force layout, nodes = 20 topics colored by user mastery, edges = prerequisite chains (arrays→two-pointers, recursion→dp, etc.) | `src/components/knowledge-graph.tsx` (new), `src/routes/_authenticated/dashboard.tsx` | ✅ Done                                                                             | ✅ Done            |

**No manual user action required for Phase 3.**

---

#### Phase 4: Growth & SEO (2–3 sessions)

| Sess. | Task                                                                                                                                                                              | Files Touched                                          | GitNexus Pre-Check                                                                 | opencode Category |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- | ----------------- |
| 4.1   | Create `/s/$submissionId` public route — renders a summary card with review score, concepts touched, and "Try CodeWise" CTA                                                       | `src/routes/s.$submissionId.tsx` (new)                 | ✅ Done                                                                            | ✅ Done            |
| 4.2   | Create server route for dynamic OG image (SVG → PNG) to enable social preview cards on Twitter/Discord                                                                            | `src/routes/api/public/og.$submissionId.png.ts` (new) | ✅ Done                                                                            | ✅ Done            |
| 4.3   | Create `/learn/$slug` SSR route — one page per topic slug, pull name + description from topics table. Unique `<title>` + `<meta description>` per page. Cross-link related topics | `src/routes/learn.$slug.tsx` (new)                     | `gitnexus_context({name: "getTopicBySlug"})` — check server fn used by learn pages | Code              |

**No manual user action required for Phase 4.**

---

#### Phase 5: Research Scaffolding (2–3 sessions)

| Sess. | Task                                                                                                                                                                     | Files Touched                                                                                                           | GitNexus Pre-Check                                                                       | opencode Category |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------- |
| 5.1   | Create `scripts/eval.ts` — Node.js script that reads a CSV corpus (code + language + expected_concept_slugs), calls `reviewCode` server fn for each, and tallies results | `scripts/eval.ts` (new)                                                                                                 | `gitnexus_context({name: "reviewCode"})` — understand input/output contract              | Script            |
| 5.2   | Add precision/recall/F1 per concept, confusion matrix output as JSON, per-language breakdown                                                                             | `scripts/eval.ts`                                                                                                       | `gitnexus_query({query: "reviewCode AI JSON parsing"})` — find AI response parsing flow  | Script            |
| 5.3   | Build export endpoint: download all user submissions + issues + progress as CSV/JSON for paper experimental section                                                      | `src/lib/codewise.functions.ts` (new `exportUserData` server fn), `src/routes/_authenticated/settings.export.tsx` (new) | `gitnexus_impact({target: "codewise.functions"})` — check adding to monolithic server fn | Code              |

**Manual user action required for Phase 5:**

- Source or create a labelled CS1/CS2 buggy-code dataset (code snippets + known concept errors)
- Place corpus CSV at `scripts/corpus/labelled-errors.csv`

---

#### Phase 6: B2B & Admin (3–4 sessions) — **Future / Post-Paper**

| Sess. | Task                                                                                                                       | Files Touched                                                                                         | GitNexus Pre-Check                                                                      | opencode Category |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------- |
| 6.1   | Create `user_roles` migration + `has_role(user_id, role_name)` SECURITY DEFINER function. Add admin-only RLS policy bypass | `supabase/migrations/*_user_roles.sql` (new)                                                          | `gitnexus_query({query: "admin authorization RLS"})` — find existing auth patterns      | SQL               |
| 6.2   | Build admin dashboard route (protected by admin role): all users table, usage stats, subscription overview                 | `src/routes/_authenticated/admin.dashboard.tsx` (new)                                                 | `gitnexus_context({name: "getAdminDashboard"})` — check admin fn dependencies           | Code              |
| 6.3   | Build seat management UI for college licenses, CSV/JSON export for user data                                               | `src/routes/_authenticated/admin.seats.tsx` (new), `src/routes/_authenticated/admin.export.tsx` (new) | `gitnexus_context({name: "supabaseAdmin"})` — trace admin client usage across codebase  | Code              |
| 6.4   | Build CS curriculum mapping UI (SPPU / NPTEL topic alignment)                                                              | `src/routes/_authenticated/admin.curriculum.tsx` (new)                                                | `gitnexus_impact({target: "curriculumMappings"})` — check schema dependencies           | Code              |

**Manual user action required for Phase 6:**

- Manually grant `admin` role to first admin user in Supabase (SQL: `INSERT INTO user_roles ...`)

---

### 13.5 Quick-Start: First opencode Session (GitNexus-powered)

Ready to begin? Start with **Session 1.1** — the smallest, lowest-risk task:

```
# 0. Pre-flight: ensure knowledge graph is fresh
opencode> gitnexus status
opencode> gitnexus analyze   (if stale)

# 1. Understand the auth landscape first
opencode> gitnexus_query({query: "login signup authentication"})
opencode> gitnexus_context({name: "login"})
opencode> Read src/routes/login.tsx and src/routes/signup.tsx to understand the auth form patterns
opencode> Read src/integrations/supabase/auth-middleware.ts (read-only — do not edit)

# 2. Plan the change: check blast radius of OAuth integration
opencode> gitnexus_impact({target: "auth-middleware", direction: "upstream"})

# 3. Implement
opencode> Create src/lib/auth-helpers.ts with signInWithOAuth wrapper
opencode> Create src/routes/auth/callback.tsx for OAuth redirect handling

# 4. Verify
opencode> Run npm run build to verify TypeScript
opencode> gitnexus_detect_changes()  — verify only auth files affected
```

After the session completes, **manually**: enable Google OAuth in Supabase Dashboard, then proceed to Session 1.2.

---

Generated 16 May 2026 for handoff from Lovable to opencode. Treat sections 2 (current stack) and 5 (server functions) as authoritative — they reflect the code that is actually running in the Lovable preview.

---

## 14. GitNexus Quick Reference for CodeWise

The codebase is indexed as **happy-stack-maker** (1,946 nodes, 3,145 edges, 54 clusters, 76 execution flows). Use these queries to navigate safely.

### 14.1 Before any edit — always run

| If you're changing... | Run this first |
|----------------------|----------------|
| A server function in `codewise.functions.ts` | `gitnexus_impact({target: "reviewCode"})` or equivalent symbol name |
| An auth file | `gitnexus_query({query: "authentication"})` — find all auth flows |
| A billing/payment file | `gitnexus_query({query: "payment paddle billing"})` — find all payment flows |
| A route under `_authenticated/` | `gitnexus_impact({target: "route", direction: "upstream"})` — who links here? |
| A UI component | `gitnexus_context({name: "ComponentName"})` — who imports it? |
| A database schema (migration) | `gitnexus_query({query: "subscriptions usage quota"})` — find all touchpoints |

### 14.2 Common exploration queries

These replace `grep`/`glob` for understanding how features connect:

| What you want to know | GitNexus query |
|----------------------|----------------|
| How does the review flow work end-to-end? | `gitnexus_query({query: "code review AI flow"})` |
| What touches the Supabase client? | `gitnexus_context({name: "supabaseAdmin"})` |
| How does entitlement/quota gating work? | `gitnexus_query({query: "quota consume entitlement"})` |
| What imports `paddle.server.ts`? | `gitnexus_context({name: "paddle"})` |
| How are migrations structured? | `gitnexus_query({query: "database schema migration RLS"})` |

### 14.3 High-risk symbols (always check impact before editing)

| Symbol | File | Risk | Why |
|--------|------|------|-----|
| `reviewCode` | `src/lib/codewise.functions.ts` | **CRITICAL** | Core AI review pipeline — calls `extractJson`, `getUserPlan`, `consumeQuota`. Breaks all code review. |
| `supabaseAdmin` | `src/integrations/supabase/client.server.ts` | **CRITICAL** | Centralized admin client used by 7+ server functions. DO NOT EDIT (auto-generated). |
| `consumeQuota` | `src/lib/entitlements.server.ts` | **HIGH** | SECURITY DEFINER SQL function proxy — breaking it destroys all quota gating. |
| `generatePractice` | `src/lib/codewise.functions.ts` | **HIGH** | Practice generation pipeline — calls same quota + AI chain as `reviewCode`. |
| `getDashboard` | `src/lib/codewise.functions.ts` | **MEDIUM** | Dashboard data aggregator — parallel reads to 3 tables. Breaking it breaks dashboard. |
| `PLAN_QUOTAS` | `src/lib/entitlements.server.ts` | **MEDIUM** | Central quota constants — changing values affects pricing page, billing UI, and gate logic. |

### 14.4 After committing — always run

```
gitnexus_detect_changes()
```

This maps your git diff to affected symbols and execution flows, catching unintended blast radius.

### 14.5 When the index goes stale

After major refactors or pulling new commits:
```
gitnexus status          # Check if index matches HEAD commit
gitnexus analyze         # Re-index if stale (~22s for this codebase)
gitnexus analyze --force # Full rebuild if things look wrong
```
