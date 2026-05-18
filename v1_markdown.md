# CodeWise v1: Core Feature Architecture

> Two highest-leverage features. SRS solves the core retention problem (maximizing LTV). The Free Widget acts as a zero-CAC acquisition engine.
>
> **Next session:** Start with FSRS (Section 1) — migrate `progress` table + integrate `updateFSRS` into `reviewCode`. Then Widget (Section 2) — separate Cloudflare Worker + token bucket + embed.js.
>
> **When ready, say "next session" and opencode reads this file + CODEWISE_HANDOFF_OPENCODE.md to know what to build.**

---

## 1. FSRS-Based Spaced Repetition Scheduler

### 1.1 Why SM-2 Fails for DSA

Most spaced repetition tools (Anki classic, Quizlet, early Duolingo) use the SuperMemo-2 (SM-2) algorithm. SM-2 requires the learner to self-grade their memory on a 0-5 scale after each review. For vocabulary flashcards, this works -- you know whether you remembered "aberration" or not.

For Data Structures & Algorithms, self-grading breaks down. After writing a Sliding Window solution, the student cannot reliably answer:

- "Was my solution O(N) or O(N^2)?"
- "Did I handle all edge cases?"
- "Is my variable sliding window implementation correct, or did I accidentally write a fixed window?"

The student doesn't know what they don't know. Only an AI code reviewer can detect that the algorithm is suboptimal, that 2 edge cases are missing, or that the time complexity should be O(N) but the student wrote O(N^2).

**CodeWise's advantage:** The `reviewCode` server function already grades code quality automatically. Instead of asking the user to self-grade, we pipe the AI's objective assessment directly into the FSRS algorithm, removing human guesswork from the loop entirely.

---

### 1.2 The DSR Model (Difficulty, Stability, Retrievability)

FSRS (Free Spaced Repetition Scheduler) is the modern ML-backed standard that replaced SM-2 in Anki (2023). It models every topic as three hidden Markov variables:

| Variable | Symbol | Range | Meaning |
|----------|--------|-------|---------|
| **Retrievability** | `R` | 0.0 - 1.0 | Probability the user can perfectly recall and code the pattern today |
| **Stability** | `S` | 0.1+ days | Time (in days) for R to drop from 100% to 90% |
| **Difficulty** | `D` | 1.0 - 10.0 | How inherently hard this topic is for this specific user (DP > Arrays) |

**Memory Decay Equation:**

The probability of recall decays over time Δt (days since last review):

$$R = \left(1 + \frac{\Delta t}{9 \times S}\right)^{-1}$$

When Δt = 9S, R = 0.5. When Δt = 0, R = 1.0. When the user submits a successful review, S increases and the next review is scheduled further out. When they fail, the clock resets.

**Stability Update (after successful review with grade g):**

$$S_{new} = S \times \left(1 + w_3 \times D^{-w_4} \times S^{-w_5} \times (e^{1-R} - 1)\right)$$

The term `e^(1-R)` is the key: when R is low (memory has decayed), the stability boost is larger (desirable difficulty). When R is near 1.0 (practicing too early), the boost is minimal.

**Difficulty Update:**

$$D_{new} = D - w_2 \times (g - 3)$$

Since g is 1-4 and 3 is "Good" (neutral), difficult reviews (g=1, Again) increase D. Easy reviews (g=4) decrease D.

**FSRS Weight Constants (optimized for logical problem-solving domains):**

```
Index:  [0]   [1]   [2]   [3]   [4]   [5]   [6]   [7]   [8]   [9]
Value:  0.4   0.6   2.4   5.8   4.9   0.9   0.8   0.7   1.5   0.1
```

---

### 1.3 AI-Driven Grading Matrix

Instead of asking "How well did you remember this?", the `reviewCode` server function auto-grades every submission on a 1-4 scale based on objective code quality metrics already computed:

| Grade | Label | What the AI Detected | FSRS Action |
|-------|-------|---------------------|-------------|
| **1** | Again | Fails core logic, uses brute force that times out, syntax errors, or completely wrong approach | R drops to 0. Next review: **tomorrow**. D increases by ~2.4. |
| **2** | Hard | Passes basic tests but fails edge cases. High cyclomatic complexity. Missing key optimizations. | S increases slightly. Next review: **~3 days**. |
| **3** | Good | Correct but suboptimal time/space (e.g., O(N log N) sort when O(N) two-pointer suffices). Minor warnings. | S multiplies by ~1.5. Next review: **~7 days**. |
| **4** | Easy | Optimal complexity, clean code, all edge cases handled. Solved efficiently. | S multiplies by ~2.5. Next review: **21+ days**. |

**Auto-Grade Detection Logic (mapping from existing `review_issues`):**

```typescript
function computeFSRSGrade(issues: ReviewIssue[]): 1 | 2 | 3 | 4 {
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (errors.length >= 2 || issues.some(i =>
    i.title.toLowerCase().includes('syntax') ||
    i.title.toLowerCase().includes('incorrect') ||
    i.title.toLowerCase().includes('wrong'))) return 1;

  if (errors.length === 1 || warnings.length >= 3) return 2;
  if (warnings.length >= 1) return 3;
  return 4;
}
```

Edge case: if AI fails to return parseable issues, default to Grade 3 (Good) as safety to avoid unfairly punishing the student.

---

### 1.4 Database Schema Changes

One migration extends the existing `progress` table with four new columns:

```sql
-- supabase/migrations/20260519_fsrs_columns.sql
ALTER TABLE progress ADD COLUMN IF NOT EXISTS stability DOUBLE PRECISION DEFAULT 2.5;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS difficulty DOUBLE PRECISION DEFAULT 5.0;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS retrievability DOUBLE PRECISION DEFAULT 0.9;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMPTZ;
```

**Defaults:**
- `stability = 2.5`: After first successful review, scheduled ~2.7 days out
- `difficulty = 5.0`: Midpoint, topic difficulty unknown until first review
- `retrievability = 0.9`: Assume 90% recall until first data point
- `next_review_date = null`: No review scheduled until first submission

No new tables. The existing `progress` table already has `user_id`, `topic_slug`, `mastery`, `attempts`, `last_reviewed`. The FSRS columns are additive -- existing BKT-lite `mastery` still updates as before.

---

### 1.5 Server-Side Implementation

One new function in `src/lib/codewise.functions.ts` inserted into the existing `reviewCode` flow:

```typescript
const FSRS_WEIGHTS = [0.4, 0.6, 2.4, 5.8, 4.9, 0.9, 0.8, 0.7, 1.5, 0.1];

function computeFSRSGrade(issues: ReviewIssue[]): 1 | 2 | 3 | 4 {
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  if (errors.length >= 2 || issues.some(i =>
    i.title.toLowerCase().includes('syntax') ||
    i.title.toLowerCase().includes('incorrect') ||
    i.title.toLowerCase().includes('wrong'))) return 1;
  if (errors.length === 1 || warnings.length >= 3) return 2;
  if (warnings.length >= 1) return 3;
  return 4;
}

async function updateFSRS(
  userId: string,
  topicSlug: string,
  grade: 1 | 2 | 3 | 4
): Promise<{ nextReviewDate: Date; stability: number; difficulty: number }> {
  const { data: row } = await supabaseAdmin
    .from('progress')
    .select('stability, difficulty, retrievability')
    .eq('user_id', userId).eq('topic_slug', topicSlug)
    .single();

  const D = row?.difficulty ?? 5.0;
  const S = row?.stability ?? 2.5;
  const R = row?.retrievability ?? 0.9;
  const w = FSRS_WEIGHTS;

  const newDifficulty = Math.max(1, Math.min(10, D - w[2] * (grade - 3)));

  let newStability: number;
  if (grade === 1) {
    newStability = Math.max(0.1, S * 0.5); // Reset stability on failure
  } else {
    newStability = S * (1 + w[3] * Math.pow(newDifficulty, -w[4]) *
      Math.pow(S, -w[5]) * (Math.exp(1 - R) - 1));
    newStability = Math.max(0.1, newStability);
  }

  const newR = grade === 1 ? 0 : 0.9;
  const intervalDays = 9 * newStability * ((1 / 0.9) - 1);
  const nextReview = new Date(Date.now() + intervalDays * 86400000);

  await supabaseAdmin.from('progress').upsert({
    user_id: userId,
    topic_slug: topicSlug,
    stability: newStability,
    difficulty: newDifficulty,
    retrievability: newR,
    next_review_date: nextReview.toISOString(),
    mastery: grade >= 3 ? 0.9 : grade === 2 ? 0.6 : 0.3,
    attempts: ((row as any)?.attempts ?? 0) + 1,
    last_reviewed: new Date().toISOString(),
  }, { onConflict: 'user_id,topic_slug' });

  return { nextReviewDate: nextReview, stability: newStability, difficulty: newDifficulty };
}
```

**Integration point in `reviewCode`:** After inserting `review_issues`, iterate over `concepts[]` and call `updateFSRS(userId, conceptSlug, grade)` for each detected topic slug. The grade is computed once from the full issue set (same grade applies to all topics in the submission).

**New server fn for dashboard: `getDueReviews`**

```typescript
// Returns topics where next_review_date <= now(), sorted by urgency
const getDueReviews = createServerFn({ method: 'GET' })
  .validator(z.void())
  .handler(async ({ context }) => {
    const { user } = await requireSupabaseAuth(context);
    const { data } = await supabaseAdmin
      .from('progress')
      .select('topic_slug, retrievability, next_review_date, difficulty')
      .eq('user_id', user.id)
      .lte('next_review_date', new Date().toISOString())
      .order('next_review_date', { ascending: true });
    return data ?? [];
  });
```

---

### 1.6 Frontend: Compulsion Loop UX

A new `<ReviewQueue />` component on the dashboard surfaces FSRS-driven calls to action:

**Component behavior:**
- Queries `getDueReviews` on dashboard mount (React Query with 5-min staleTime)
- Renders a card: "Review Queue" heading with urgency-coded topic cards
- Each card shows: topic name, current retrievability as percentage, difficulty stars, "Due: X hours ago" or "Due in Y hours"
- CTA button: "Solve a problem" → opens practice page with `?topic={slug}` (see Section 2.5 of handoff plan)

**Visual coding:**
- Red card / amber glow: Overdue (next_review_date < now)
- Amber card: Due within 24 hours
- Green card: Healthy (due in 2+ days -- shown in collapsed "upcoming" section)

**The compulsion loop:**
```
Student logs in → sees "Sliding Window recall at 88%. Due today."
→ Clicks "Solve a problem" → completes practice → FSRS updates mastery to 100%
→ Next review scheduled for 7 days out → student returns to maintain streak
```

No email or push notification needed. The dashboard itself is the hook, and the declining R percentage creates urgency without nagging.

**Empty state:** If no topics are due, show "All topics mastered. Check back in X days." with the earliest upcoming review date.

**New files:** `<ReviewQueue />` component in `src/components/review-queue.tsx`. Dashboard imports and renders it below the knowledge graph, above recent reviews.

---

### 1.7 Session Estimates

| Session | What | Effort |
|---------|------|--------|
| SRS-1 | Migration file + `updateFSRS` server fn + integration into `reviewCode` | 1 session |
| SRS-2 | `getDueReviews` server fn + `<ReviewQueue />` component + dashboard integration | 1 session |

**Total: 2 sessions**

---

## 2. Embeddable Free AI Code Review Widget

### 2.1 Architecture Decision: Edge, Not Main Server

If widget traffic routes through the same Cloudflare Worker as the main CodeWise app, it will:
1. Compete for CPU/memory with paying Pro users
2. Inflate the main Worker's request count (Cloudflare bills per request)
3. Couple widget uptime to main app deploys

**Solution:** Deploy a **separate Cloudflare Worker** at `widget.codewise.ai`. This worker:
- Handles only widget traffic (rate limiting, AI calls, response formatting)
- Shares zero state with the main app Worker
- Communicates with Supabase for anonymous review data (read-only, no user writes)
- Uses a dedicated KV namespace `WIDGET_RATE_LIMITS` for token buckets

**Cost isolation:**
- Widget AI calls go through the same Lovable AI Gateway (cost per review = ~$0.01)
- Widget free reviews are a marketing expense, not an infrastructure burden
- Separate Worker has its own request quota (100K free/day on Cloudflare, ~$5/month beyond)

---

### 2.2 Token Bucket Rate Limiter (Edge KV)

To prevent bot scraping and API budget drain without requiring login:

**Algorithm:** Token Bucket with IP + User-Agent fingerprinting.

| Parameter | Value | Reason |
|-----------|-------|--------|
| Capacity | 3 tokens | Enough to review 3 code snippets (try-before-buy) |
| Refill rate | 1 token / 8 hours | One free review every 8 hours keeps the widget useful |
| Key TTL | 24 hours | Stale buckets auto-expire, no cleanup needed |
| Fingerprint | SHA-256(IP + User-Agent prefix) | Prevents KV key enumeration, avoids storing raw IPs |

```typescript
// Cloudflare Worker: Edge Rate Limiting via Token Bucket
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkRateLimit(
  fingerprint: string,
  kv: KVNamespace
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:${fingerprint}`;
  const now = Date.now();

  let bucket = await kv.get(key, 'json') as { tokens: number; lastRefill: number } | null;
  if (!bucket) bucket = { tokens: 3, lastRefill: now };

  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(timePassed / 28800000); // 8 hours in ms

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(3, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    await kv.put(key, JSON.stringify(bucket), { expirationTtl: 86400 });
    return { allowed: true, remaining: bucket.tokens };
  }

  return { allowed: false, remaining: 0 };
}
```

**Fail-open behavior:** If KV is unavailable (network partition, rare), allow the review. Add a `console.error` for monitoring. Better to serve a free review than block a potential signup.

---

### 2.3 The Curiosity Gap Conversion UI

The widget returns AI review results in two tiers -- the "unlocked" tier provides enough value to prove competence, while the "locked" tier creates the conversion moment.

**Unlocked (Free tier — always shown):**
- Code correctness: Pass / Fail indicator with a checkmark or X icon
- Big-O Time Complexity detected (e.g., "O(N^2)")
- One high-level optimization hint (e.g., "Consider using a hash map for O(1) lookups")
- Topics touched (e.g., "Arrays, Hashing" as tag badges)
- A brief summary line (e.g., "Your solution works but is 4x slower than optimal.")

**Locked (Curiosity Gap — blurred/gated):**
- Full line-by-line issue breakdown with severity, concept mapping, and fix hints
- Alternative optimal approach with code comparison
- Personalised follow-up: "This pattern appears in 14 LeetCode problems tagged Google/Meta"
- CTA button: "Unlock full review + track progress across 20 DSA topics → Free signup (takes 30 seconds)"

**No extra AI cost for the preview:** The AI already returns the full review JSON. We split the response -- the free tier shows `summary` + `concepts` + first line of `issues[0].title`, while the locked tier withholds the full `issues[]` array. Zero additional API calls for the upsell.

**CTA link:** `https://codewise.ai/signup?return_to=/dashboard` -- after signup, user lands on their dashboard with the review they just submitted visible as their first submission (stored server-side during widget processing, linked via a temporary anonymous session token).

---

### 2.4 Iframe + postMessage Implementation

**The embed snippet (placed by partner blogs):**

```html
<script src="https://widget.codewise.ai/embed.js" data-theme="dark"></script>
<div id="codewise-review-target"></div>
```

**`embed.js` (~5KB gzipped, vanilla JS -- no framework dependency):**
- Creates a shadow DOM inside `#codewise-review-target` to prevent CSS leakage onto the host page
- Dynamically generates an `<iframe>` pointing to `https://widget.codewise.ai/?theme=dark`
- Listens for `postMessage` from the iframe to auto-resize height
- Passes theme preference to the iframe so the widget matches the host page's light/dark mode

**postMessage protocol:**

```typescript
// Iframe → Host (auto-resize):
window.parent.postMessage({
  type: 'codewise:resize',
  height: 450  // new height in pixels after results render
}, 'https://widget.codewise.ai');

// Host → Iframe (optional, for theme changes):
iframe.contentWindow.postMessage({
  type: 'codewise:theme',
  theme: 'light'
}, 'https://widget.codewise.ai');
```

Origin validation on both sides: only accept messages from `codewise.ai` and `widget.codewise.ai`.

**Widget UI states:**
1. **Initial:** CodeMirror-lite textarea + language dropdown (Python/JS/Java/C++) + "Review my code" button
2. **Loading:** Pulse animation + "Analyzing your code..."
3. **Results:** Free tier content + blurred locked tier + "Unlock full review" CTA
4. **Rate limited:** "You've used your 3 free reviews. Next one available in X hours. Sign up for 50 reviews/month free."

---

### 2.5 Database & Route Structure

**No new database tables needed for the widget MVP.** Anonymous widget reviews are stateless -- processed in-memory and returned.

**Optional analytics table (post-MVP):**

```sql
CREATE TABLE widget_review_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint_hash TEXT,
  referring_domain TEXT,
  language TEXT,
  topics_detected TEXT[],
  conversion BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

This enables: total widget reviews, conversion rate, top referring domains, most reviewed languages. But not required for launch.

**Deployment:**
- New file: `widget/wrangler.toml` (Cloudflare Worker config, separate from main app)
- New file: `widget/worker.ts` (Worker entry point)
- KV namespace: `WIDGET_RATE_LIMITS` (created via `wrangler kv:namespace create`)
- Route: `widget.codewise.ai/*` (subdomain, DNS CNAME → Cloudflare)

**The `reviewCode` logic is shared** between the main app and widget worker. Extract the AI call + JSON parsing into a shared utility in `src/lib/ai-review.ts` that both the `reviewCode` server fn and the widget worker import. The widget worker calls it without auth (anonymous), the server fn calls it with auth (user-scoped).

---

### 2.6 Funnel: Widget → Pro Conversion

**Projected funnel math (conservative):**

```
Partner blog traffic:                       1,000 impressions/day
Widget engagement (10% paste code):           100 reviews/day
Curiosity gap exposure (60% have issues):      60 locked tier views/day
CTA click-through (5% of locked views):          3 signups/day
Pro conversion (10% of signups):                0.3 Pro/day = ~9 Pro/month
```

At 9 Pro/month × $199/year = $1,791 additional ARR/month from widget alone. Over 12 months: $21,492 ARR from this channel. CAC = $0 (partner blogs host the widget for free -- they get engaging content for their readers).

**Widget distribution channels:**
1. GeeksforGeeks DSA article authors embed the widget in tutorial posts
2. LinkedIn DSA creators share review preview cards
3. GitHub README badges: "Reviewed by CodeWise"
4. College LMS/portal embeds
5. Placement cell resource pages

**Tracking:** The widget CTA link includes UTM params: `?utm_source=widget&utm_medium=embed&utm_campaign=free_review`. Plausible analytics (already installed) tracks widget→signup→Pro conversion.

---

### 2.7 Session Estimates

| Session | What | Effort |
|---------|------|--------|
| Widget-1 | Separate Worker scaffold: `widget/wrangler.toml`, `widget/worker.ts`, KV namespace, rate limiter | 1 session |
| Widget-2 | Extract shared AI review logic into `src/lib/ai-review.ts`, wire widget worker to call it, curiosity gap response splitting | 1 session |
| Widget-3 | `embed.js` (vanilla JS, shadow DOM, postMessage, auto-resize), iframe route on widget worker with UI states | 1 session |
| Widget-4 | Analytics logging, partner documentation page at `/widget/docs`, Plausible conversion tracking | 1 session |

**Total: 4 sessions**

---

## 3. Integration: SRS Meets Widget

**How the two features connect in the user journey:**

```
1. Student discovers DSA blog with CodeWise widget
2. Pastes their Two Sum solution → gets free review
3. Sees: "O(N^2) detected. You're missing the hash map pattern. 
   Unlock full review + track progress → Free signup"
4. Signs up → first reviewCode call runs → FSRS auto-grades the submission
5. Dashboard shows: "Hashing: 62% mastery. Due for review tomorrow."
6. Student practices → FSRS updates → next review 7 days out
7. Student returns to maintain their recall streak → LTV compounds
```

**Migration summary (single file for SRS columns):**

```sql
-- supabase/migrations/20260519_fsrs_columns.sql
ALTER TABLE progress ADD COLUMN IF NOT EXISTS stability DOUBLE PRECISION DEFAULT 2.5;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS difficulty DOUBLE PRECISION DEFAULT 5.0;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS retrievability DOUBLE PRECISION DEFAULT 0.9;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMPTZ;
```

**New Cloudflare resources:**
- 1 KV namespace: `WIDGET_RATE_LIMITS`
- 1 separate Worker deploy: `widget.codewise.ai/*`

**Total session estimate (both features): 6 sessions** (2 SRS + 4 Widget). No external dependencies. All within the existing TanStack Start + Supabase + Cloudflare Workers stack.

---

*Document prepared 19 May 2026. Covers the two highest-leverage features for CodeWise v1: FSRS Spaced Repetition for retention/LTV, and the Embeddable Widget for zero-CAC acquisition.*
