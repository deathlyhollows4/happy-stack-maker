# CodeWise — Status & Handoff Brief for opencode

**AI Code Reviewer & Learning Companion for CS Students**

| Field                 | Value                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| Project Lead          | Vidhan Tomar — BE IT, Army Institute of Technology, Pune               |
| Built on              | Lovable (preview project)                                              |
| Handoff target        | **opencode** (CLI assistant)                                           |
| Document date         | 16 May 2026                                                            |
| Status                | Working MVP deployed in preview — auth, dashboard, AI review, practice |
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
| 6 — B2B & Admin | 🔴 **NEXT** | — | 6.1: user_roles SQL migration + has_role fn |

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

**Credentials:** `vidhantomar17082004@gmail.com` / `Jaatdevta@123`
**Paddle test card:** `4242 4242 4242 4242`, CVC `123`, any future expiry

**Manual actions pending (user):**
- Enable Google OAuth in Supabase Dashboard (Auth → Providers → Google) and create Google Cloud Console OAuth 2.0 client
- Verify Paddle identity (Payments tab in Lovable) before accepting real payments
- Run Supabase migrations (SQL files in `supabase/migrations/`)

---

## 1. What changed vs the original plan

The original document described a Next.js + Python FastAPI + Prisma + DeepSeek stack. The MVP that was actually built collapses that into one isomorphic TanStack Start app:

| Layer              | Originally planned        | Actually built                                       |
| ------------------ | ------------------------- | ---------------------------------------------------- |
| Frontend framework | Next.js (App Router)      | TanStack Start v1 (React 19, Vite 7)                 |
| Server logic       | Python FastAPI backend    | TanStack createServerFn (TypeScript)                 |
| ORM / DB layer     | Prisma + Postgres         | Supabase JS client (RLS-enforced)                    |
| AI provider        | DeepSeek API              | Lovable AI Gateway → google/gemini-3-flash-preview   |
| Hosting (frontend) | Lovable Pro               | Lovable (Cloudflare Workers via vite-plugin)         |
| Hosting (backend)  | Railway / VPS for FastAPI | Same Worker — no separate backend                    |
| Auth               | OAuth (Google, GitHub)    | Supabase Auth — email + password only (no OAuth yet) |
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
| AI                 | Lovable AI Gateway                                 | Model: google/gemini-3-flash-preview, JSON-object response_format |
| Code editor        | CodeMirror 6 (@uiw/react-codemirror)               | Python, JavaScript, Java, C++ language packs                      |
| Charts             | Recharts 2.15                                      | Only imported where needed (dashboard mastery bars)               |
| Toasts             | Sonner 2.0                                         | Used for login/signup/review feedback                             |
| Hosting            | Lovable (Cloudflare Workers)                       | Preview + published from same repo, no manual deploy              |

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
│   ├── auth/
│   │   └── callback.tsx           # OAuth post-redirect handler
│   ├── api/public/
│   │   └── payments/
│   │       └── webhook.ts         # Paddle webhook receiver
│   └── _authenticated/
│       ├── route.tsx              # Pathless layout: sidebar + client-side auth gate
│       ├── dashboard.tsx          # Stats, topic mastery, recent reviews
│       ├── review.tsx             # Code editor -> reviewCode (quota-gated)
│       └── practice.tsx           # generatePractice (quota-gated) + listPractice
├── lib/
│   ├── codewise.functions.ts      # Server fn: reviewCode, getDashboard, getSubmission, generatePractice, listPractice, getEntitlements
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
│   └── migrations/                # SQL migrations (run manually on Supabase)
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

### 6.2 Not yet built (gaps for opencode to close)

- Google OAuth + Apple sign-in (currently email/password only)
- Password reset flow (/forgot-password + /reset-password pages)
- ~~Stripe (or Razorpay) payment + freemium gating~~ → Done: Paddle via Lovable Gateway
- Billing page UI at `/_authenticated/billing` (server fns exist: `cancelSubscription`, `getCustomerPortalUrl`, `getEntitlements`)
- Past-due banner in authenticated layout (read `pastDue` from entitlements)
- `?checkout=success` toast on landing page after Paddle checkout completes
- Submission detail page (/\_authenticated/review/$submissionId) — server fn exists, UI does not
- Knowledge graph visualization (prerequisite chains across the 20 topics)
- Share-your-review-score viral loop (public OG image + /s/$id route)
- College / team licenses: user_roles table + admin dashboard
- SEO landing pages per topic (/learn/$slug) and per language
- Analytics (Plausible or PostHog) — currently nothing wired
- Export user data (submissions + mastery as CSV/JSON)
- CS curriculum mapping UI (SPPU / NPTEL alignment)
- Research corpus: import labelled CS1/CS2 buggy-code dataset for eval harness
- User study scaffolding for the ICNDIA paper (consent flow, anonymized telemetry)

---

## 7. Recommended next steps for opencode

Suggested order, smallest risk first. Each step includes what opencode can do directly and what actions require manual user intervention.

### Step 1: Google OAuth + Password Reset

**opencode can do:**

- Edit `src/integrations/supabase/auth-middleware.ts` to accept OAuth tokens
- Create `src/routes/auth/callback.tsx` (OAuth redirect handler)
- Add `src/routes/forgot-password.tsx` and `src/routes/reset-password.tsx`
- Wire react-hook-form + zod forms for password reset
- Update signup.tsx to include OAuth buttons

**Manual user action required:**

- Enable Google OAuth provider in Supabase dashboard (Authentication > Providers)
- Create Google Cloud Console OAuth client with redirect URI

### Step 2: Freemium Quota System

**opencode can do:**

- Create a `user_quotas` migration in `supabase/migrations/`
- Edit `reviewCode` in `codewise.functions.ts` to check quota before calling AI
- Add quota tracking to dashboards (remaining reviews this month)
- Show upgrade CTA when free tier is exhausted
- Add `reviewCount` or `quotaUsed` column (or compute from submissions.created_at)

**Manual user action required:**

- Run migration via Supabase CLI or dashboard

### Step 3: Stripe Checkout + Webhook

**opencode can do:**

- Create `src/routes/api/public/stripe-webhook.ts` (server route)
- Create a `subscriptions` table migration
- Create `src/routes/settings/billing.tsx` (manage plan UI)
- Add a `pricing` page at `/pricing`
- Wire Stripe SDK for Checkout Session creation

**Manual user action required:**

- Set up Stripe Products & Prices in Stripe dashboard
- Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to `.env` (and Lovable secrets)
- Configure webhook endpoint URL in Stripe dashboard

### Step 4: Submission Detail Page

**opencode can do:**

- Create `src/routes/_authenticated/review.$submissionId.tsx`
- Use existing `getSubmission` server fn
- Render code + issues side-by-side (split layout)
- Add click-through from dashboard recent reviews list

**No manual action required.** Purely frontend + existing API.

### Step 5: Knowledge Graph Visualization

**opencode can do:**

- Add a small d3-force or Recharts treemap component on dashboard
- Model prerequisite chains from the 20 topics (define edges: arrays->two-pointers, recursion->dp, etc.)
- Color nodes by user's mastery level from the progress table
- Make it a reusable `<KnowledgeGraph />` component in `src/components/`

**No manual action required.** Data already exists; purely frontend.

### Step 6: Share-a-Review Viral Loop

**opencode can do:**

- Create `src/routes/s.$submissionId.tsx` (public route, no auth)
- Generate OG metadata via TanStack Start `head()` (title, description, image)
- Create `src/routes/api/public/og.$submissionId.png.tsx` server route that renders an SVG/PNG card
- Add "Share Results" button on submission detail page
- Generate a share URL with review score + topic summary

**No manual action required.** Purely code.

### Step 7: Per-Topic SEO Landing Pages

**opencode can do:**

- Create `src/routes/learn.$slug.tsx` with SSR
- Pull topic description + name from Supabase topics table
- Generate unique `<title>` and `<meta name="description">` per slug
- List related topics, show sample concepts
- Render a static "Try CodeWise" CTA

**No manual action required.** Data comes from topics table.

### Step 8: Eval Harness for Research

**opencode can do:**

- Create `scripts/eval.ts` (Node script)
- Import a labelled corpus (CSV of code + expected concepts)
- Replay each sample through `reviewCode` server fn (or call the API route directly)
- Compute precision/recall on concept_slug detection
- Output confusion matrix as JSON

**Manual user action required:**

- Source a labelled CS1/CS2 buggy-code dataset
- Add the corpus CSV to `scripts/corpus/`

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
| Supabase dashboard config | No — manual step       | —                                      |
| Stripe dashboard config   | No — manual step       | —                                      |
| OAuth app registration    | No — manual step       | —                                      |
| Lovable Cloud secrets     | No — manual step       | —                                      |
| Visual QA / pixel check   | No                     | Cannot render UI                       |

### opencode workflow for this project

1. **Read** a file to understand existing patterns
2. **Edit** to implement changes
3. **Run** `npm run build` (or `npx tsc --noEmit`) to catch TypeScript errors
4. **Run** `npm run lint` to catch ESLint issues
5. **Iterate** — fix errors and re-check
6. User verifies UI changes manually in the browser

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

| Sess. | Task                                                                                            | Files Touched                                                                                           | opencode Category |
| ----- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------- |
| 1.1   | Add Google OAuth callback route + helper to accept OAuth provider tokens                        | `src/routes/auth/callback.tsx` (new), `src/lib/auth-helpers.ts` (new, wraps Supabase `signInWithOAuth`) | Code              |
| 1.2   | Build forgot-password + reset-password pages with react-hook-form + zod validation              | `src/routes/forgot-password.tsx` (new), `src/routes/reset-password.tsx` (new)                           | Code              |
| 1.3   | Wire Supabase `resetPasswordForEmail` + `updateUser`, add OAuth buttons to login + signup pages | `src/routes/login.tsx`, `src/routes/signup.tsx`                                                         | Code              |

**Manual user action required for Phase 1:**

- Enable Google OAuth provider in Supabase Dashboard (Authentication → Providers)
- Create Google Cloud Console OAuth 2.0 client with redirect URI matching the deployed callback URL
- Optional: enable Apple sign-in (requires Apple Developer account)

---

#### Phase 2: Monetization Foundation (3–4 sessions)

| Sess. | Task                                                                                                                                                  | Files Touched                                                                                    | opencode Category |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------- |
| 2.1   | Create `user_quotas` DB migration: table (user_id, reviews_used, period_start) + RLS. Add quota check guard in `reviewCode` before calling AI Gateway | `supabase/migrations/*_user_quotas.sql` (new), `src/lib/codewise.functions.ts`                   | Code + SQL        |
| 2.2   | Create Stripe webhook server route, create `subscriptions` table migration                                                                            | `src/routes/api/public/stripe-webhook.ts` (new), `supabase/migrations/*_subscriptions.sql` (new) | Code + SQL        |
| 2.3   | Build `/pricing` page with tier cards, Stripe Checkout redirect, and `/settings/billing` page showing current subscription                            | `src/routes/pricing.tsx` (new), `src/routes/_authenticated/settings.billing.tsx` (new)           | Code              |
| 2.4   | Wire "Upgrade to Pro" CTA on dashboard and review page when quota exhausted                                                                           | `src/routes/_authenticated/dashboard.tsx`, `src/routes/_authenticated/review.tsx`                | Code              |

**Manual user action required for Phase 2:**

- Create Products & Prices in Stripe Dashboard (Free, Pro ₹199/mo, College ₹99K/yr)
- Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env` and Lovable Cloud secrets
- Configure Stripe webhook endpoint to point at deployed `/api/public/stripe-webhook`

---

#### Phase 3: UI Completion (2–3 sessions)

| Sess. | Task                                                                                                                                                                    | Files Touched                                                                         | opencode Category |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------- |
| 3.1   | Create `/_authenticated/review.$submissionId.tsx` — split layout: code on left, issues list on right. Reuse existing `getSubmission` server fn                          | `src/routes/_authenticated/review.$submissionId.tsx` (new)                            | Code              |
| 3.2   | Add clickable "View" button to each recent submission row on dashboard                                                                                                  | `src/routes/_authenticated/dashboard.tsx`                                             | ✅ Done            |
| 3.3   | Build `<KnowledgeGraph />` component: d3-force layout, nodes = 20 topics colored by user mastery, edges = prerequisite chains (arrays→two-pointers, recursion→dp, etc.) | `src/components/knowledge-graph.tsx` (new), `src/routes/_authenticated/dashboard.tsx` | ✅ Done            |

**No manual user action required for Phase 3.**

---

#### Phase 4: Growth & SEO (2–3 sessions)

| Sess. | Task                                                                                                                                                                              | Files Touched                                          | opencode Category |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------- |
| 4.1   | Create `/s/$submissionId` public route — renders a summary card with review score, concepts touched, and "Try CodeWise" CTA                                                       | `src/routes/s.$submissionId.tsx` (new)                 | ✅ Done            |
| 4.2   | Create server route for dynamic OG image (SVG → PNG) to enable social preview cards on Twitter/Discord                                                                            | `src/routes/api/public/og.$submissionId.png.ts` (new) | ✅ Done            |
| 4.3   | Create `/learn/$slug` SSR route — one page per topic slug, pull name + description from topics table. Unique `<title>` + `<meta description>` per page. Cross-link related topics | `src/routes/learn.$slug.tsx` (new)                     | Code              |

**No manual user action required for Phase 4.**

---

#### Phase 5: Research Scaffolding (2–3 sessions)

| Sess. | Task                                                                                                                                                                     | Files Touched                                                                                                           | opencode Category |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 5.1   | Create `scripts/eval.ts` — Node.js script that reads a CSV corpus (code + language + expected_concept_slugs), calls `reviewCode` server fn for each, and tallies results | `scripts/eval.ts` (new)                                                                                                 | Script            |
| 5.2   | Add precision/recall/F1 per concept, confusion matrix output as JSON, per-language breakdown                                                                             | `scripts/eval.ts`                                                                                                       | Script            |
| 5.3   | Build export endpoint: download all user submissions + issues + progress as CSV/JSON for paper experimental section                                                      | `src/lib/codewise.functions.ts` (new `exportUserData` server fn), `src/routes/_authenticated/settings.export.tsx` (new) | Code              |

**Manual user action required for Phase 5:**

- Source or create a labelled CS1/CS2 buggy-code dataset (code snippets + known concept errors)
- Place corpus CSV at `scripts/corpus/labelled-errors.csv`

---

#### Phase 6: B2B & Admin (3–4 sessions) — **Future / Post-Paper**

| Sess. | Task                                                                                                                       | Files Touched                                                                                         | opencode Category |
| ----- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------- |
| 6.1   | Create `user_roles` migration + `has_role(user_id, role_name)` SECURITY DEFINER function. Add admin-only RLS policy bypass | `supabase/migrations/*_user_roles.sql` (new)                                                          | SQL               |
| 6.2   | Build admin dashboard route (protected by admin role): all users table, usage stats, subscription overview                 | `src/routes/_authenticated/admin.dashboard.tsx` (new)                                                 | Code              |
| 6.3   | Build seat management UI for college licenses, CSV/JSON export for user data                                               | `src/routes/_authenticated/admin.seats.tsx` (new), `src/routes/_authenticated/admin.export.tsx` (new) | Code              |
| 6.4   | Build CS curriculum mapping UI (SPPU / NPTEL topic alignment)                                                              | `src/routes/_authenticated/admin.curriculum.tsx` (new)                                                | Code              |

**Manual user action required for Phase 6:**

- Manually grant `admin` role to first admin user in Supabase (SQL: `INSERT INTO user_roles ...`)

---

### 13.5 Quick-Start: First opencode Session

Ready to begin? Start with **Session 1.1** — the smallest, lowest-risk task:

```
opencode> Read src/routes/login.tsx and src/routes/signup.tsx to understand the auth form patterns
opencode> Read src/integrations/supabase/auth-middleware.ts (read-only — do not edit)
opencode> Create src/lib/auth-helpers.ts with signInWithOAuth wrapper
opencode> Create src/routes/auth/callback.tsx for OAuth redirect handling
opencode> Run npm run build to verify TypeScript
```

After the session completes, **manually**: enable Google OAuth in Supabase Dashboard, then proceed to Session 1.2.

---

Generated 16 May 2026 for handoff from Lovable to opencode. Treat sections 2 (current stack) and 5 (server functions) as authoritative — they reflect the code that is actually running in the Lovable preview.
