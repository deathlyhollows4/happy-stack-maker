# CodeWise Low-Cognitive-Load UI & Navigation Implementation Plan

> **For Hermes:** Use agent-mesh routing to implement this plan task-by-task. Recommended: @Forge for React/TanStack implementation, @Scout for browser crawl verification, @Maven for copy/SEO checks.

**Goal:** Reduce CodeWise cognitive load by making the student journey obvious, surfacing hidden content routes, fixing Blog/Explore/Learn IA mismatch, and creating a clean 2-3 phase roadmap that can be implemented without breaking Lovable/TanStack behavior.

**Architecture:** Centralize public navigation into shared components, add missing content hubs (/learn and /blog), keep student app navigation focused on core actions, and use redirects/canonical URLs to avoid duplicate SEO. Preserve existing routes while migrating labels and links gradually.

**Tech Stack:** TanStack Start, React 19, TypeScript, Tailwind CSS v4, Supabase, Lovable Cloud, Playwright E2E, browser-harness/Chrome CDP on PC.

---

## Evidence Collected

### Runtime crawl on PC localhost

Explored using PC SSH/browser tooling against `http://localhost:3001`.

Public pages tested:
- `/` -> 200, title `CodeWise. AI code reviewer for CS students`, nav: Dashboard, Pricing, Sign in, Get started
- `/explore` -> 200, title `Explore | CodeWise`, body label `BLOG`, H1 `Explore`, empty state `No posts yet. Check back soon.`
- `/pricing` -> 200, H1 `Simple plans. Real learning.`
- `/login` -> 200
- `/signup` -> 200
- `/forgot-password` -> 200
- `/terms` -> 200
- `/refunds` -> 200
- `/privacy` -> 200
- `/sitemap.xml` -> 200, includes `/`, `/pricing`, `/explore`, `/login`, `/signup`, `/terms`, `/privacy`, `/refunds`; no `/blog`
- `/blog` -> 404
- `/blog/ai-code-review` -> 404
- `/about`, `/features`, `/contact`, `/reviews`, `/upload`, `/app` -> 404

Authenticated pages observed:
- `/dashboard` -> 200, panels: Knowledge graph, Review Queue, Topic mastery, Recent reviews, Practice
- `/review` -> 200, code editor/upload/language/review flow
- `/practice` -> 200, 20+ topic options, language options, problem cards, editor
- `/settings` -> 200, sections: Profile, Security, Appearance, Data & Billing, Research, Danger zone
- `/settings/export` -> title changes to `Export Data | CodeWise`, but visible H1/content remains generic Settings page
- `/billing` -> 200
- `/submission/$id` -> 200

Console/browser errors:
- No captured console errors during the crawl.

### Source route inventory

Public/user-visible routes:
- `src/routes/index.tsx` -> `/`
- `src/routes/explore.tsx` -> `/explore`
- `src/routes/explore.$slug.tsx` -> `/explore/$slug`
- `src/routes/learn.$slug.tsx` -> `/learn/$slug`
- `src/routes/pricing.tsx` -> `/pricing`
- `src/routes/login.tsx` -> `/login`
- `src/routes/signup.tsx` -> `/signup`
- `src/routes/forgot-password.tsx` -> `/forgot-password`
- `src/routes/reset-password.tsx` -> `/reset-password`
- `src/routes/privacy.tsx` -> `/privacy`
- `src/routes/terms.tsx` -> `/terms`
- `src/routes/refunds.tsx` -> `/refunds`
- `src/routes/s.$submissionId.tsx` -> `/s/$submissionId`
- `src/routes/health.ts` -> `/health`
- `src/routes/sitemap[.]xml.ts` -> `/sitemap.xml`
- `src/routes/auth/callback.tsx` -> `/auth/callback`

Authenticated routes:
- `src/routes/_authenticated/dashboard.tsx` -> `/dashboard`
- `src/routes/_authenticated/review.tsx` -> `/review`
- `src/routes/_authenticated/practice.tsx` -> `/practice`
- `src/routes/_authenticated/billing.tsx` -> `/billing`
- `src/routes/_authenticated/settings.tsx` -> `/settings`
- `src/routes/_authenticated/settings.export.tsx` -> `/settings/export`
- `src/routes/_authenticated/submission.$submissionId.tsx` -> `/submission/$submissionId`

Admin routes:
- `/admin/dashboard`, `/admin/blog`, `/admin/curriculum`, `/admin/export`, `/admin/research`, `/admin/seats`, `/admin/settings`, `/admin/update-price`

Hidden/misaligned surfaces:
- Blog system exists: `src/lib/blog-posts.ts`, `src/lib/blog.functions.ts`, `src/routes/_authenticated/admin.blog.tsx`
- Public blog is currently `/explore` and `/explore/$slug`, but the page label says `Blog`
- No canonical `/blog` or `/blog/$slug`
- Learn topic detail pages exist at `/learn/$slug`, but no `/learn` index/hub exists
- `/admin/research` exists but is not linked from `admin.dashboard.tsx`
- `/settings/export` exists but renders like generic Settings after navigation

### Source UX/code issues observed

- Public header is duplicated in multiple route files instead of centralized.
- `src/components/site-footer.tsx` is flat and only links Explore/Pricing/Legal.
- Header on home omits Blog/Explore and Learn.
- Auth nav only has Dashboard, Review, Practice. That is good for focus, but Learn is missing once `/learn` exists.
- Some source content contains corrupted characters, visible in reads as `A�`, `dYZ%`, `Loading�?�`. Examples found in `index.tsx` and `site-footer.tsx`. This needs a cleanup pass.
- `/explore` says `Blog` as eyebrow but H1 says `Explore`, adding unnecessary cognitive translation.

---

## Product Principles for the Fix

1. **Use student intent labels, not internal labels.**
   - `Review Code`, `Practice`, `Learn`, `Blog`, `Pricing`.
   - Avoid vague `Explore` unless it becomes a real combined discovery hub.

2. **Limit primary nav.**
   - Public nav: max 4 links + CTA.
   - Auth nav: max 4 core student actions.
   - Move Billing/Settings/Admin into account dropdown.

3. **Separate content types clearly.**
   - Learn = evergreen CS/DSA topic pages.
   - Blog = articles/guides/learning strategy.
   - Practice = active problem solving.
   - Review Code = submit code and receive feedback.

4. **One dominant CTA per page.**
   - Home: Start free review.
   - Learn topic: Practice this topic.
   - Blog post: Review your code.
   - Pricing: Start free / Upgrade.

5. **Do not break existing URLs.**
   - If adding `/blog`, preserve `/explore` with redirect/alias until analytics/SEO are stable.

---

## Execution Status

| Phase | Status | Date | Git Ref | Notes |
|-------|--------|------|---------|-------|
| Phase 1 — Navigation clarity | **COMPLETED** | 13 Jun 2026 | d8ac6ec | Site header, footer grouping, label fixes, encoding fix, admin link |
| Phase 2 — Content hubs | **COMPLETED** | 13 Jun 2026 | d8ac6ec | /learn hub, /blog routes, sitemap, canonical URLs |
| Phase 3 — Student workflow | **COMPLETED** | 13 Jun 2026 | d8ac6ec | Dashboard next-action, practice stepper, submission next-actions |
| Phase 4 — Mobile UI fixes | **COMPLETED** | 13 Jun 2026 | uncommitted | See vps-ssh-wf-codefise.md Phase 4 section |

---

# Phase 1 — Navigation clarity and cognitive-load quick wins

**Goal:** Make existing surfaces discoverable without major route migration.

**Expected impact:** Users immediately see Learn/Blog and know what to do next. Low implementation risk.

## Task 1.1: Create shared public site header

**Objective:** Stop duplicating public header in every route and make nav changes once.

**Files:**
- Create: `src/components/site-header.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/explore.tsx`
- Modify: `src/routes/pricing.tsx`
- Modify: `src/routes/privacy.tsx`
- Modify: `src/routes/terms.tsx`
- Modify: `src/routes/refunds.tsx`
- Modify: `src/routes/learn.$slug.tsx`

**Implementation shape:**

```tsx
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

type SiteHeaderProps = {
  hasSession?: boolean;
  active?: "home" | "learn" | "blog" | "pricing";
};

export function SiteHeader({ hasSession = false, active }: SiteHeaderProps) {
  const nav = [
    { to: "/learn", label: "Learn", key: "learn" },
    { to: "/blog", label: "Blog", key: "blog" },
    { to: "/pricing", label: "Pricing", key: "pricing" },
  ] as const;

  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2" aria-label="CodeWise home">
          <span className="font-display text-2xl">CodeWise</span>
          <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
            beta
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-sm" aria-label="Main navigation">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to as any}
              className={
                active === item.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          ))}
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            to={hasSession ? "/review" : "/signup"}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start free review <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

**Notes:**
- If `/learn` and `/blog` are not added until Phase 2, temporarily point:
  - Learn -> `/explore` with label `Learn` only if a section exists, or hide until Phase 2.
  - Blog -> `/explore` during Phase 1.
- Preferred: implement lightweight `/learn` and `/blog` in Phase 2 immediately after header extraction.

**Verification:**
```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker; npm run build"'
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker; npx playwright test --project=chromium tests/e2e/critical-path.spec.ts"'
```

## Task 1.2: Clean footer IA

**Objective:** Convert the flat footer into grouped footer links with clear content categories.

**Files:**
- Modify: `src/components/site-footer.tsx`

**Recommended footer groups:**
- Product: Home, Review Code, Practice, Pricing
- Learn: Learn Topics, Blog
- Legal: Terms, Refunds, Privacy

**Implementation shape:**

```tsx
const groups = [
  {
    title: "Product",
    links: [
      { to: "/", label: "Home" },
      { to: "/review", label: "Review Code" },
      { to: "/practice", label: "Practice" },
      { to: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Learn",
    links: [
      { to: "/learn", label: "Topics" },
      { to: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms" },
      { to: "/refunds", label: "Refunds" },
      { to: "/privacy", label: "Privacy" },
    ],
  },
];
```

**Important:** Auth-only routes (`/review`, `/practice`) can be footer links, but expect redirect to login for anonymous users. If that feels confusing, route them to `/signup` via CTA instead.

## Task 1.3: Rename high-friction labels

**Objective:** Use clearer student-facing labels.

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/explore.tsx`
- Modify: `src/routes/explore.$slug.tsx`
- Modify: `src/routes/_authenticated/route.tsx`

**Label updates:**
- `Get started` -> `Start free review`
- `Join CodeWise` -> `Start free review`
- Auth nav `Review` -> `Review Code`
- If keeping `/explore` in Phase 1: nav label should be `Blog`, not `Explore`
- `/explore` H1 should be either:
  - `Blog` if only blog posts
  - `Explore CodeWise` if it becomes a combined content hub

## Task 1.4: Fix visible corrupted characters

**Objective:** Remove encoding artifacts that damage trust.

**Files to scan:**
- `src/routes/index.tsx`
- `src/components/site-footer.tsx`
- Entire `src/` if time allows

**Search command:**
```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker; Select-String -Path src/**/*.tsx,src/**/*.ts -Pattern ''A�|�|dYZ|🐴''"'
```

**Observed examples:**
- `CodeWise A� AI code review for CS students.` in footer readout
- `You're subscribed. Welcome to Pro dYZ%` in home toast readout
- `O(nA�)` and list bullets rendered as `A�` in home preview
- `Loading�?�` in auth layout readout
- `/explore` browser title observed as `🐴 Explore | CodeWise` in browser crawl

**Replace with:**
- `CodeWise - AI code review for CS students.`
- `You're subscribed. Welcome to Pro.`
- `O(n²)` or `O(n^2)` depending project encoding policy
- `Loading...`

**CodeWise source has a no-em-dash policy in memory; use hyphen, not em dash.**

## Task 1.5: Admin quick link cleanup

**Objective:** Make admin tools complete without leaking into student nav.

**Files:**
- Modify: `src/routes/_authenticated/admin.dashboard.tsx`

**Changes:**
- Add `/admin/research` quick link if the route is active.
- Or delete/retire route later if obsolete.
- Keep Admin access only in user dropdown for admins.

---

# Phase 2 — Create missing Learn and Blog hubs

**Goal:** Fix the structural issue: pages exist but are not reachable/discoverable from top-level IA.

**Expected impact:** Learn content and blog/articles become explicit, crawlable, and usable.

## Task 2.1: Add `/learn` topic index

**Objective:** Surface existing `/learn/$slug` pages through a public topic hub.

**Files:**
- Create: `src/routes/learn.tsx`
- Possibly use existing server function from `src/lib/codewise.functions.ts` or add a focused function in `src/lib/dashboard.functions.ts` / topic function area.
- Modify: `src/routes/learn.$slug.tsx` to add breadcrumb/back-link.
- Modify: `src/routes/sitemap[.]xml.ts` to include `/learn`.

**UX structure:**
- H1: `Learn CS topics`
- Short copy: `Browse the DSA concepts CodeWise tracks in your reviews and practice.`
- Search/filter by topic name.
- Categories: Arrays, Strings, Hash Tables, Trees, Graphs, Dynamic Programming, Sorting, Complexity, Recursion.
- Cards show:
  - Topic name
  - Description
  - Difficulty/frequency if available
  - CTAs: `Learn`, `Practice`

**Route behavior:**
- `/learn` is public.
- `/learn/$slug` stays public.
- Practice CTA can route to `/practice?topic=$slug`; unauthenticated users will hit auth redirect, acceptable if CTA text clarifies `Sign in to practice` when no session.

## Task 2.2: Add canonical `/blog` index

**Objective:** Make blog match product vocabulary and user expectation.

**Files:**
- Create: `src/routes/blog.tsx`
- Modify or reuse logic from `src/routes/explore.tsx`
- Modify: `src/routes/sitemap[.]xml.ts`

**Recommended approach:**
- Treat `/blog` as canonical.
- Keep `/explore` as a redirect or alias for one release.
- If TanStack redirect is simple, redirect `/explore` -> `/blog`.
- If not, keep duplicate page but set canonical link to `/blog`.

**Copy:**
- H1: `Blog`
- Eyebrow: `Resources for CS students`
- Empty state: `No posts published yet. Check back soon.`

## Task 2.3: Add canonical `/blog/$slug` route

**Objective:** Move article URLs from vague `/explore/$slug` to clear `/blog/$slug`.

**Files:**
- Create: `src/routes/blog.$slug.tsx`
- Reuse logic from `src/routes/explore.$slug.tsx`
- Modify: `src/routes/explore.$slug.tsx` to redirect/alias or set canonical
- Modify: `src/routes/sitemap[.]xml.ts`

**Canonical strategy:**
- Preferred: `/blog/$slug` canonical.
- `/explore/$slug` redirect to `/blog/$slug`.
- If redirect risks breaking TanStack/Lovable, leave `/explore/$slug` rendering but canonical to `/blog/$slug` and use internal links to `/blog/$slug` only.

## Task 2.4: Add cross-links between Learn, Blog, Practice, Review

**Objective:** Create a learning loop instead of isolated pages.

**Files:**
- Modify: `src/routes/learn.$slug.tsx`
- Modify: `src/routes/blog.$slug.tsx` or `src/routes/explore.$slug.tsx`
- Modify: `src/routes/index.tsx`
- Possibly modify `src/lib/blog-posts.ts` / DB tags to map posts to topic slugs

**Blocks to add:**
- Blog post bottom:
  - Related topics
  - CTA: `Review your code`
- Learn topic bottom:
  - Related topics
  - CTA: `Practice this topic`
  - CTA: `Review code using this concept`
- Home:
  - Featured topics (3-6 cards)
  - Latest blog posts (3 cards)

---

# Phase 3 — Personalized student workflow and deeper cognitive-load reduction

**Goal:** Make the app feel like a guided study coach rather than a collection of tools.

**Expected impact:** Better retention and conversion because students know the next action.

## Task 3.1: Simplify Dashboard into next-action layout

**Objective:** Reduce the current dashboard's competing panels.

**Files:**
- Modify: `src/routes/_authenticated/dashboard.tsx`
- Possibly modify: `src/components/knowledge-graph.tsx`, `src/components/review-queue.tsx`

**Current issue:** Dashboard shows Knowledge graph, Review Queue, Topic mastery, Recent reviews, Practice, and graph instructions. That is useful but dense.

**Recommended hierarchy:**
1. Primary card: `Your next best action`
   - If no submissions: `Submit code for review`
   - If weak topic exists: `Practice [weak topic]`
   - If review queue exists: `Review feedback`
2. Secondary row:
   - Mastery progress
   - Recent reviews
3. Advanced/collapsible:
   - Knowledge graph
   - Full topic mastery table

## Task 3.2: Convert Practice page into stepper flow

**Objective:** Make Practice less overwhelming.

**Files:**
- Modify: `src/routes/_authenticated/practice.tsx`

**Current issue:** Practice exposes Weakest Topic, 20+ topics, languages, problem buttons, editor, Run/Submit all at once.

**Recommended flow:**
1. Step 1: Choose topic
   - Suggested: weakest topic
   - Search/filter all topics behind disclosure
2. Step 2: Choose language
3. Step 3: Pick/generated problem
4. Step 4: Solve in editor
5. Step 5: Run / Submit

**Keep power-user mode:** Add `Show all options` for advanced users.

## Task 3.3: Make Review results route users into Learn/Practice

**Objective:** Turn AI feedback into action.

**Files:**
- Modify: `src/routes/_authenticated/submission.$submissionId.tsx`
- Modify: any result components inside review/submission flow

**Add:**
- `Weak concepts found`
- `Learn [topic]`
- `Practice [topic]`
- `Review another solution`

## Task 3.4: Fix Settings Export UX

**Objective:** Make `/settings/export` a distinct page/action.

**Files:**
- Modify: `src/routes/_authenticated/settings.export.tsx`
- Modify: `src/routes/_authenticated/settings.tsx`

**Expected UX:**
- `/settings` has a Data card with button `Export my data`.
- `/settings/export` renders H1 `Export Data`, explanation, export status, and `Download JSON` / `Request export` action.
- It should not look identical to generic Settings.

---

## Recommended Final Information Architecture

### Public nav

- Logo -> `/`
- Learn -> `/learn`
- Blog -> `/blog`
- Pricing -> `/pricing`
- Sign in -> `/login`
- CTA: Start free review -> `/signup` or `/review` if logged in

### Authenticated nav

- Dashboard -> `/dashboard`
- Review Code -> `/review`
- Practice -> `/practice`
- Learn -> `/learn`
- Avatar dropdown:
  - Billing -> `/billing`
  - Settings -> `/settings`
  - Export data -> `/settings/export`
  - Admin -> `/admin/dashboard` only if admin
  - Sign out

### Footer

Product:
- Home
- Review Code
- Practice
- Pricing

Learn:
- Topics
- Blog

Legal:
- Terms
- Refunds
- Privacy

### Content routes

- `/learn` = topic hub
- `/learn/$slug` = topic detail
- `/blog` = article hub
- `/blog/$slug` = article detail
- `/explore` = redirect/alias only, unless it becomes a broader hub

---

## Test Plan

### Static checks

```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker; npm run build"'
```

### E2E checks

Update `tests/e2e/critical-path.spec.ts` or add `tests/e2e/navigation-ia.spec.ts`.

Must verify:
- Home nav exposes Learn, Blog, Pricing, Sign in, Start free review.
- `/learn` returns 200 and shows topic cards.
- `/learn/$slug` has breadcrumbs and Practice CTA.
- `/blog` returns 200 and no longer shows `Explore` as H1.
- `/blog/$slug` returns article detail for a seeded/published post.
- `/explore` redirects or canonicalizes to `/blog`.
- Auth nav exposes Dashboard, Review Code, Practice, Learn.
- Settings dropdown exposes Billing, Settings, Export data.
- `/settings/export` renders H1 `Export Data`.

Command:
```bash
ssh -F /opt/data/.ssh/config obamabinladen 'powershell -Command "cd C:/Users/brawl/OneDrive/Documents/GOATEDDD/CodeWise/happy-stack-maker; npx playwright test --project=chromium"'
```

### Browser smoke crawl

Use browser-harness or HTTP from PC:
- `http://localhost:3001/`
- `http://localhost:3001/learn`
- `http://localhost:3001/blog`
- `http://localhost:3001/pricing`
- `http://localhost:3001/dashboard`
- `http://localhost:3001/review`
- `http://localhost:3001/practice`
- `http://localhost:3001/settings/export`

### SEO checks

- `/sitemap.xml` includes `/learn`, `/blog`, `/blog/$slug` if posts exist.
- Canonical URLs do not duplicate `/explore/$slug` and `/blog/$slug`.
- Page titles:
  - `Learn CS Topics | CodeWise`
  - `Blog | CodeWise`
  - `[Post Title] | CodeWise Blog`

### Accessibility checks

- Header nav has `aria-label="Main navigation"`.
- Mobile menu button has clear `aria-label`.
- Avatar dropdown has accessible label.
- Icon-only controls on dashboard/settings have text or aria labels.

---

## Implementation Order

Recommended 3-phase execution:

1. **Phase 1 first commit:** `feat: clarify navigation and content labels`
   - Shared public header
   - Footer grouping
   - Label changes
   - Encoding artifact cleanup
   - Admin research quick link

2. **Phase 2 second commit:** `feat: add learn and blog hubs`
   - `/learn`
   - `/blog`
   - `/blog/$slug`
   - sitemap/canonical updates
   - internal linking

3. **Phase 3 third/fourth commits:** `feat: simplify student workflow`
   - Dashboard next-action layout
   - Practice stepper layout
   - Review-to-learn/practice links
   - Settings export page

All 3 phases committed together at d8ac6ec.

4. **Phase 4 (post-plan):** Mobile responsive UI + green styling
   - Review page: responsive layout, green success tones
   - Learn page: fixed duplicate navbar
   - Practice page: mobile overflow fix
   - See vps-ssh-wf-codefise.md Phase 4 section

---

## Risks and Mitigations

1. **Duplicate SEO from `/explore/$slug` and `/blog/$slug`.**
   - Mitigation: redirect old URLs or set canonical to `/blog/$slug`.

2. **Authenticated routes in public footer may redirect to login.**
   - Mitigation: use public CTAs or conditionally route if session exists.

3. **Header extraction may break route-specific session logic.**
   - Mitigation: pass `hasSession` prop from route or create a small `useSessionPresence` hook.

4. **Lovable/TanStack route tree regeneration.**
   - Mitigation: do not edit `routeTree.gen.ts`; run build/dev to regenerate.

5. **Blog data may be empty locally.**
   - Mitigation: design empty state well; ensure admin.blog can publish; tests should not assume posts exist unless seeded.

6. **Encoding artifact cleanup can accidentally introduce em dashes.**
   - Mitigation: use ASCII hyphen and run source scan.

---

## Agent-Mesh Execution Routing

- **@Forge:** implement Phase 1/2/3 code changes and Playwright tests.
- **@Scout:** crawl post-change site via PC browser-harness and report nav/console evidence.
- **@Maven:** review labels, page titles, meta descriptions, sitemap/canonical content strategy.
- **@Sentinel:** only needed if dev server/browser/PC automation breaks.

---

## Done Definition

The plan is complete when:
- Public nav exposes Learn and Blog clearly.
- `/blog` no longer 404s.
- `/learn` exists and surfaces topic pages.
- `/explore` mismatch is resolved by redirect/alias or relabeling.
- `/settings/export` has distinct content.
- Auth nav remains simple and student-intent based.
- Dashboard/Practice have a clear next-action hierarchy.
- `npm run build` passes.
- Playwright navigation tests pass.
- browser-harness crawl confirms no console errors and all key routes return 200.
