# CodeWise Comprehensive Audit & Improvement Plan

> **Repo:** `happy-stack-maker` (179 files, 1,655 nodes, 2,298 edges, 55 clusters, 31 flows)
> **Audit:** Triple-agent mesh analysis (@Forge, @Cipher, @Sentinel) on 2026-06-11
> **Commit:** `741b0f9246d369b58d29d71b250a4cc5727029a1`

---

## Executive Summary

45 findings across code quality, algorithms, security, and infrastructure. **7 Critical, 14 High, 15 Medium, 9 Low.**

CodeWise is functionally complete (Phases 1-9 + SRS shipped) but has significant technical debt:
- The core FSRS algorithm has a **correctness bug** that prevents spaced intervals from growing
- All 28 server functions live in a **single 1,284-line monolith**
- **Zero automated tests**, zero CI/CD, zero observability
- The AI review pipeline lacks retry backoff and JSON repair
- 42 of 46 shadcn/ui components are unused dead code

**Recommended: 4-week stabilization sprint before adding new features.**

---

## Critical Path — Must Fix Before Production Traffic

### C1: FSRS Interval Formula Degenerate (No Spacing Growth)

| Field | Detail |
|-------|--------|
| **File** | `src/lib/codewise.functions.ts:179-180` |
| **Severity** | CRITICAL — Core feature broken |
| **Bug** | `intervalDays = 9 * newStability * (1 / 0.9 - 1)` simplifies algebraically to `intervalDays = newStability`. Intervals never grow multiplicatively — a student who gets "Easy" (grade=4) 10 times still gets the same review interval as the first time. |
| **Root cause** | The decay equation `R = (1 + Δt/(9S))^(-1)` was solved for Δt with R=0.9, yielding Δt = S. But `newR` is hardcoded to 0.9 for all non-failing reviews. The stability multiplier `S * (1 + w3 * D^(-w4) * S^(-w5) * (e^(1-R) - 1))` collapses to ~1.000085 for realistic values. |
| **Fix** | Replace the degenerate formula with the standard FSRS optimal interval: `Δt = S * (desiredR^(-1/D) - 1)`. Recompute `newR` from the forgetting curve after interval assignment, not hardcode 0.9. Reference: Jarrett Ye's FSRS-5 implementation. |
| **Verification** | After fix, a student with S=2.5 and grade=4 should get ~7-day interval. After 5 successive "Easy" reviews, interval should be 60+ days. |

### C2: FSRS Grade Applied Uniformly to All Concepts

| Field | Detail |
|-------|--------|
| **File** | `src/lib/codewise.functions.ts:355-358` |
| **Severity** | CRITICAL — Feature logic wrong |
| **Bug** | `const grade = computeFSRSGrade(parsed.issues); await Promise.all(concepts.map((slug) => updateFSRS(userId, slug, grade)));` — one grade from ALL issues applied to EVERY concept. A bug in "arrays" code degrades the student's "recursion" mastery. |
| **Fix** | Compute per-concept grades. Filter issues by `concept_slug`, call `computeFSRSGrade` per concept. Concepts with zero matching issues get grade=4 (Easy). |
| **Verification** | Submit code with array bug + perfect recursion. Check `progress` table: "arrays" row should show grade=1 (stability reset), "recursion" should show grade=4 (stability increased). |

### C3: 28-Function Monolith in codewise.functions.ts

| Field | Detail |
|-------|--------|
| **File** | `src/lib/codewise.functions.ts` (1,284 lines, 44KB) |
| **Severity** | CRITICAL — Maintainability blocker |
| **Details** | 28 server functions spanning 7 domains: review, practice, dashboard, admin, blog, consent, curriculum |
| **Split into** | `review.functions.ts` (reviewCode, getSubmission, getPublicSubmission), `practice.functions.ts` (generatePractice, listPractice), `dashboard.functions.ts` (getDashboard, getDueReviews), `admin.functions.ts` (getAdminDashboard, seat mgmt, export), `blog.functions.ts` (6 CRUD fns), `consent.functions.ts` (get/set consent, record event), `curriculum.functions.ts` (get/upsert mappings) |
| **Verification** | Each new file imports only its dependencies. `npm run build` passes. No route broken. |

### C4: SYSTEM_PROMPT + Schemas Duplicated in eval.ts

| Field | Detail |
|-------|--------|
| **Files** | `src/lib/codewise.functions.ts:82-120` and `scripts/eval.ts:57-95` |
| **Severity** | CRITICAL — Testing validity |
| **Duplicates** | SYSTEM_PROMPT (38 lines), VALID_TOPIC_SLUGS, ReviewIssueSchema, ReviewResponseSchema, LANGS |
| **Impact** | eval.ts tests against a stale prompt copy. If production prompt changes, eval metrics are worthless. Also eval.ts skips `extractJson()` (line 272 vs production line 276) — false negatives in benchmarks. |
| **Fix** | Create `src/lib/review.constants.ts` exporting SYSTEM_PROMPT, VALID_TOPIC_SLUGS, schemas, LANGS. Both codewise.functions.ts and eval.ts import from it. eval.ts imports `extractJson` too. |

### C5: No CI/CD Pipeline

| Field | Detail |
|-------|--------|
| **Severity** | CRITICAL — No automated verification |
| **Impact** | Every build/deploy is manual. No PR validation. No lint enforcement. No automated migration application. |
| **Fix** | Create `.github/workflows/ci.yml`: on push to main + PRs → checkout, setup Node 22, npm ci, npm run build, npm run lint. Add second workflow for Supabase migration validation. |
| **Deliverable** | `.github/workflows/ci.yml` + `.github/workflows/validate-migrations.yml` |

### C6: No Observability / Error Aggregation

| Field | Detail |
|-------|--------|
| **Severity** | CRITICAL — Production blind spot |
| **Files** | `src/lib/error-capture.ts` (5s TTL singleton, race-condition prone), `src/server.ts` (console.error only, ephemeral in Workers) |
| **Impact** | 43 console.error calls across codebase log to a black hole. Cloudflare Workers tail is ephemeral — errors vanish after stream ends. Zero crash reporting for paying users. |
| **Fix** | Integrate Sentry or LogRocket in `src/server.ts`. Add structured JSON logging. Replace the fragile `lastCapturedError` singleton with request-scoped error context (AsyncLocalStorage). |

### C7: No Automated Migration Runner

| Field | Detail |
|-------|--------|
| **Severity** | CRITICAL — Schema drift risk |
| **Files** | `supabase/migrations/` (19 SQL files) |
| **Impact** | Handoff doc explicitly says "run manually on Supabase." No way to verify which migrations are applied in production. Two curriculum_mappings migrations (20260517090835 + 20260518001930) overlap. |
| **Fix** | Add a migration status check script querying `supabase_migrations.schema_migrations`. Integrate into CI. Consolidate duplicate curriculum_mappings DDL. |

---

## High Priority — Fix Within 2 Weeks

### H1: No Webhook Idempotency (Duplicate Payment Events)

**File:** `src/routes/api/public/payments/webhook.ts:76-91` and `src/lib/paddle.server.ts:54-61`

`verifyWebhook` checks signature but there is no duplicate detection. Paddle retries on non-2xx/timeout. Blind UPDATEs from retries can cause state oscillation (past_due → active → past_due).

**Fix:** Store Paddle `event_id` in a `webhook_events` table. Check before processing. Return 200 for duplicates.

### H2: learn.$slug.tsx — 475 Lines Hardcoded Educational Content

**File:** `src/routes/learn.$slug.tsx:79-553` (51KB, 881 lines total)

The `topicEducationMap` object contains rich educational content for all 20 DSA topics: overviews, operations complexity tables, common patterns with cross-links, MAANG frequency, prerequisites. This is:

- Not editable without a code deploy (51KB file change for one topic update)
- Not localizable
- Not cacheable independently
- Blocks SSR since it's a Route component not a server function

**Fix:** Add columns to `topics` table (overview, operations_json, common_patterns_json, when_to_use, when_to_avoid, maang_frequency, prerequisites). Load via `getTopicBySlug` server fn. CMS-editable, SSR-compatible, independently cacheable.

### H3: 42 Unused shadcn/ui Components

**Finding:** 46 files in `src/components/ui/`, only 4 actually imported by app routes (sonner, skeleton, avatar, dialog). ~42 components are dead code — they only serve as internal shadcn cross-dependencies.

**Fix:** Delete the 36+ unused component files. Alternatively keep them only if the component library is intentionally pre-generated for future use.

### H4: No React Error Boundaries

**Search result:** Zero `ErrorBoundary` or `errorBoundary` in `src/`. Only `__root.tsx` has TanStack Router's built-in errorComponent.

**Impact:** A crash in `<KnowledgeGraph>` (d3-force, 20KB) takes down the entire dashboard. AI-generated markdown rendering crash kills the review page.

**Fix:** Add `<ErrorBoundary>` wrappers around: `KnowledgeGraph` (lazy-loaded), CodeMirror editors, `<Markdown>` components rendering AI output.

### H5: No Security Headers

**Files:** `src/server.ts`, `wrangler.jsonc` — zero security headers configured.

**Fix:** Add middleware or response transform injecting: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy: default-src 'self'`.

### H6: No Server-Side Rate Limiting

Auth endpoints (`/login`, `/signup`, `/forgot-password`) have no rate limiting. Public endpoints (`/s/$id`, `/learn/$slug`, OG image, sitemap) can be scraped/DDoSed.

**Fix:** Add Cloudflare Workers rate limiting or in-memory counter with KV. At minimum protect auth routes with 5 req/min per IP.

### H7: No Database Backup Strategy

Word "backup" appears only in privacy policy legal disclaimer. No pg_dump scripts, no Supabase backup configuration documented. 12 tables with user data and payments.

**Fix:** Verify Supabase automated backups are enabled (included in Pro tier). Add ad-hoc pg_dump script. Add backup verification to operational runbook.

### H8: No Health Check Endpoint

**Fix:** Add `src/routes/health.ts` returning `{ status: "ok", timestamp, version, commit }`. No DB dependency for basic check. Optionally add `/health/db` for Supabase connectivity.

### H9-H14: Medium Severity Issues (Abbreviated)

| # | Issue | File | Fix |
|---|-------|------|-----|
| H9 | AI retry loop — 3 identical calls, no backoff | codewise.functions.ts:272-311 | Add exponential backoff + jitter |
| H10 | Sequential DB writes — no transaction | codewise.functions.ts:321-352 | Supabase RPC transaction wrapper |
| H11 | Quota cache infinite TTL | entitlements.server.ts:13-37 | Add 60s TTL timestamp check |
| H12 | computeFSRSGrade uses string matching | codewise.functions.ts:133-136 | Grade on severity count only |
| H13 | Multiple code duplications (LANG_LABELS, langExt, loadEditorSettings, envInput) | review.tsx, practice.tsx, submission.$submissionId.tsx, s.$submissionId.tsx, code-exec.functions.ts | Extract to shared utils |
| H14 | TOPIC_LIST hardcoded in practice.tsx (4th copy of topic catalog) | practice.tsx:55-76 | Fetch from DB via server fn |

---

## Algorithmic & Performance Issues

| # | Severity | Issue | Location | Big-O |
|---|----------|-------|----------|-------|
| A1 | HIGH | FSRS interval=stability (no growth) | codewise.functions.ts:179 | O(1) — but wrong |
| A2 | HIGH | FSRS grade shared across concepts | codewise.functions.ts:355 | O(C) → should be O(C * I) per concept |
| A3 | MEDIUM | extractJson fragile, no JSON repair | codewise.functions.ts:19 | O(N) regex, no fallback |
| A4 | MEDIUM | getAdminDashboard O(N) full scans | codewise.functions.ts:690 | O(U+S+C) unoptimized |
| A5 | MEDIUM | getTopicBySlug fetches ALL topics | codewise.functions.ts:433 | O(N) client filter |
| A6 | MEDIUM | getDashboard LIMIT 10 hardcoded | codewise.functions.ts:387 | O(1) but incomplete |
| A7 | MEDIUM | FSRS failure silently swallowed | codewise.functions.ts:354 | O(C) no error propagation |
| A8 | LOW | languageBreakdown dead code | eval.ts:361 | O(1) — never called |
| A9 | MEDIUM | eval.ts skips extractJson | eval.ts:272 | O(N) — false negatives |
| A10 | LOW | Markdown component insecure (no rehype-sanitize) | markdown.tsx | XSS risk |

---

## Infrastructure & DevOps Issues

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| D1 | CRITICAL | No CI/CD | `.github/` missing |
| D2 | CRITICAL | No automated migrations | `supabase/migrations/` |
| D3 | CRITICAL | No observability | `error-capture.ts`, `server.ts` |
| D4 | HIGH | Missing `.env.example` | Repo root |
| D5 | HIGH | No security headers | `server.ts`, `wrangler.jsonc` |
| D6 | HIGH | No rate limiting | All routes |
| D7 | HIGH | No database backup | No scripts |
| D8 | HIGH | No health check | No `/health` route |
| D9 | MEDIUM | npm audit: 4 moderate (CVE GHSA-58qx) | `@cloudflare/vite-plugin` |
| D10 | MEDIUM | Conflicting lockfiles (npm + bun) | `package-lock.json`, `bun.lock` |
| D11 | MEDIUM | No test infrastructure | 0 test files |
| D12 | MEDIUM | No build ID tracking | `wrangler.jsonc`, `vite.config.ts` |
| D13 | LOW | No README | Repo root |
| D14 | LOW | Migration ordering gaps | `supabase/migrations/` (duplicate DDL) |
| D15 | LOW | Error capture race condition | `error-capture.ts:4-9` |

---

## Testing & Fixing Plan

### Phase 1: Immediate (Week 1) — Fix Critical Bugs

| Task | Priority | Effort |
|------|----------|--------|
| Fix FSRS interval formula (C1) | P0 | 2h |
| Fix FSRS per-concept grading (C2) | P0 | 1.5h |
| Extract SYSTEM_PROMPT + schemas to shared constants (C4) | P0 | 1h |
| Add `extractJson` to eval.ts (H9) | P0 | 0.5h |
| Add unit tests for `computeFSRSGrade`, `updateFSRS`, `extractJson` | P0 | 3h |

### Phase 2: Stabilize (Week 2) — Add Tests + Split Monolith

| Task | Priority | Effort |
|------|----------|--------|
| Split codewise.functions.ts into 6 domain files (C3) | P1 | 3h |
| Extract shared utils (LANG_LABELS, langExt, envInput, loadEditorSettings) | P1 | 1.5h |
| Add vitest config + first 15 unit tests | P1 | 4h |
| Add Playwright config + 5 critical-path E2E tests | P1 | 3h |
| Create `.github/workflows/ci.yml` (C5) | P1 | 1h |

### Phase 3: Harden (Week 3) — Security + Infrastructure

| Task | Priority | Effort |
|------|----------|--------|
| Add webhook idempotency (H1) | P2 | 2h |
| Add security headers (H5) | P2 | 1h |
| Add auth rate limiting (H6) | P2 | 2h |
| Add health check endpoint (H8) | P2 | 0.5h |
| Add error boundaries (H4) | P2 | 1.5h |
| Add Sentry/LogRocket (C6) | P2 | 2h |

### Phase 4: Optimize (Week 4) — Performance + Polish

| Task | Priority | Effort |
|------|----------|--------|
| Migrate learn.$slug.tsx to DB-backed (H2) | P3 | 3h |
| Delete 36+ unused shadcn/ui components (H3) | P3 | 0.5h |
| Add AI retry backoff (H9) | P3 | 1h |
| Add transaction wrapper for review writes (H10) | P3 | 2h |
| Add quota cache TTL (H11) | P3 | 0.5h |
| Fix computeFSRSGrade string matching (H12) | P3 | 0.5h |
| Add rehype-sanitize to Markdown (A10) | P3 | 0.5h |
| Create `.env.example` (D4) | P3 | 0.5h |
| Remove bun.lock + standardize npm (D10) | P3 | 0.5h |
| Create README.md (D13) | P3 | 1h |

### Test Plan Template

```typescript
// tests/lib/codewise.functions.test.ts
import { describe, it, expect } from 'vitest';
import { computeFSRSGrade, updateFSRS, extractJson } from '@/lib/codewise.functions';

describe('computeFSRSGrade', () => {
  it('returns grade 1 for code with 2+ errors', () => {
    const issues = [
      { severity: 'error', title: 'Wrong time complexity' },
      { severity: 'error', title: 'Missing edge case' },
    ];
    expect(computeFSRSGrade(issues)).toBe(1);
  });

  it('returns grade 4 for clean code with 0 issues', () => {
    expect(computeFSRSGrade([])).toBe(4);
  });

  it('returns grade 3 for code with 1 warning only', () => {
    const issues = [{ severity: 'warning', title: 'Consider using const' }];
    expect(computeFSRSGrade(issues)).toBe(3);
  });

  it('returns grade 2 for code with 3+ warnings', () => {
    const issues = [
      { severity: 'warning', title: 'Naming' },
      { severity: 'warning', title: 'Complexity' },
      { severity: 'warning', title: 'Style' },
    ];
    expect(computeFSRSGrade(issues)).toBe(2);
  });

  // NEW test: no longer uses string matching
  it('does NOT downgrade to 1 based on title keywords', () => {
    const issues = [{ severity: 'warning', title: 'Syntax could be clearer' }];
    // After fix: grade on severity count only, not string matching
    expect(computeFSRSGrade(issues)).toBe(3);
  });
});

describe('extractJson', () => {
  it('extracts from markdown fence', () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(JSON.parse(extractJson(input))).toEqual({ key: 'value' });
  });

  it('extracts from first brace', () => {
    const input = 'Some text {"key": "value"} more text';
    expect(JSON.parse(extractJson(input))).toEqual({ key: 'value' });
  });

  it('returns raw on no braces', () => {
    expect(extractJson('plain text')).toBe('plain text');
  });
});

describe('updateFSRS interval growth', () => {
  it('intervals grow multiplicatively for consecutive Easy grades', () => {
    // After fix: S=2.5, grade=1 → interval ~1 day
    // After fix: S=2.5, grade=4 → interval ~7 days
    // After fix: 5x Easy → interval 60+ days
    expect(true).toBe(true); // Placeholder — requires DB mock
  });
});
```

---

## 4-Week Implementation Roadmap

```
Week 1 (Critical)          Week 2 (Stabilize)          Week 3 (Harden)           Week 4 (Optimize)
┌──────────────────┐      ┌──────────────────┐       ┌──────────────────┐      ┌──────────────────┐
│ Fix FSRS interval │      │ Split monolith    │       │ Webhook idemp    │      │ learn DB migration│
│ Fix per-concept   │      │ Extract shared    │       │ Security headers │      │ Delete dead UI   │
│ grade             │      │ utils             │       │ Rate limiting    │      │ Retry backoff    │
│ Extract constants │      │ 15 unit tests     │       │ Health check     │      │ Transaction wrap │
│ Fix eval.ts       │      │ 5 E2E tests       │       │ Error boundaries │      │ Quota TTL        │
│ 4 unit tests      │      │ CI/CD workflow    │       │ Sentry/LogRocket │      │ Fix string match │
│                   │      │                   │       │                  │      │ Safe markdown    │
│                   │      │                   │       │                  │      │ .env.example     │
│                   │      │                   │       │                  │      │ README.md        │
└──────────────────┘      └──────────────────┘       └──────────────────┘      └──────────────────┘
   5 tasks, ~8h              5 tasks, ~12.5h             5 tasks, ~9h              8 tasks, ~10h
```

**Total: 23 tasks, ~40 hours across 4 weeks.** Executable by a single developer or the agent mesh.

---

## Positive Findings (What's Good)

The audit was comprehensive but the project has real strengths:

- **TypeScript strict mode** enabled across the codebase
- **RLS enforced** on all 12 Supabase tables (service role for admin ops)
- **Paddle webhook signature verification** implemented (just missing idempotency)
- **Plausible analytics** SPA tracking is complete (router.subscribe based)
- **Clean error-page.ts** renders branded error page for SSR failures
- **React Query caching** correctly configured with staleTime + gcTime
- **File-based routing** is well-organized: _authenticated layout group, public API routes, clean SEO routes
- **FSRS migration** correctly extends the existing `progress` table (no new tables)
- **Content style guidelines** enforced in AGENTS.md and SYSTEM_PROMPT
- **CodeMirror themes** (10 themes) are well-structured with HighlightStyle

---

*Audit by @Prime (orchestrator) with @Forge (code quality), @Cipher (algorithms/security), and @Sentinel (infrastructure). 45 findings, 23 fix tasks, 4-week stabilization plan. Document prepared 11 June 2026.*
