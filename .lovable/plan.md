
# CodeWise — MVP Build Plan

The original doc specifies Next.js + FastAPI + DeepSeek. Since you said "use what's easier", I'll swap to the native Lovable stack — same product, faster build, no separate Python backend to host.

## Stack adjustments

| Plan doc | What I'll use | Why |
|---|---|---|
| Next.js | TanStack Start (current template) | Already scaffolded |
| FastAPI (Python) | TanStack server functions | One deploy, no extra hosting |
| DeepSeek API | Lovable AI Gateway (Gemini) | Built-in, no API key setup, free during promo |
| Supabase (external) | Lovable Cloud | One-click, managed |
| Prisma | Supabase client + migrations | Native to Lovable Cloud |
| CodeMirror 6 | CodeMirror 6 | Keep as-is |

## Scope (MVP — buildable in one pass)

1. **Landing page** — hero, problem/solution, feature grid, pricing teaser, CTA
2. **Auth** — email/password via Lovable Cloud (signup, login, logout)
3. **Code Review workspace** (`/review`)
   - CodeMirror editor (Python/C++/Java/JS), language picker
   - "Review my code" button → server function → Lovable AI
   - Renders: issues list (line + severity + explanation + concept tag + fix hint), overall summary, detected misconceptions
4. **Dashboard** (`/dashboard`)
   - Recent submissions list
   - Mastery bars per DSA topic (BKT-lite: updated mastery = prior + α·(correct − prior), per concept tagged by the reviewer)
   - Streak / total reviews
5. **Practice generator** (`/practice`)
   - "Generate a problem for my weakest topic" → AI produces problem statement + starter code + hidden test hints
   - Submit attempt → reviewed → mastery updates

## Data model (Lovable Cloud)

- `profiles` (id, display_name, created_at)
- `topics` (slug, name, category) — seeded with ~20 DSA topics (arrays, hashing, recursion, trees, graphs, DP, etc.)
- `submissions` (id, user_id, language, code, summary, created_at)
- `review_issues` (id, submission_id, line, severity, concept_slug, explanation, fix_hint)
- `progress` (user_id, topic_slug, mastery [0..1], attempts, last_reviewed) — PK (user_id, topic_slug)
- `practice_problems` (id, user_id, topic_slug, prompt, starter_code, created_at)

RLS: every table user-scoped via `auth.uid() = user_id`. `topics` readable by all.

## Server functions

- `reviewCode({ code, language })` → calls AI Gateway with pedagogical system prompt returning JSON `{summary, issues[], concepts[]}`. Persists submission + issues, updates `progress` for each concept.
- `generatePractice({ topicSlug? })` → picks weakest topic if none given, calls AI for problem.
- `getDashboard()` → returns recent submissions + mastery rows.

## Design direction

Dark editorial / "developer tool" aesthetic — deep navy background, mono accents, single saturated accent (electric cyan), JetBrains Mono for code, Inter for UI. Card-based dashboard, generous whitespace on landing.

## Routes

```
/                 landing
/login /signup
/_authenticated/  (layout — redirects guests)
  dashboard
  review
  practice
```

## Out of scope (for this pass)

- Stripe/payments, college license flow
- Email notifications, leaderboards
- Real BKT (using simplified mastery update; can swap to full Bayesian later)
- SEO blog content, sitemap automation (basic per-route meta only)

## Risk

Lovable AI returning malformed JSON — handled with strict schema + retry-once + graceful fallback message.

Ready to build on approval.
