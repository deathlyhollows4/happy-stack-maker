
## CodeWise UX Improvements — Re-audited Plan

I cross-checked all 16 issues from the uploaded doc against the current code. The doc audits the **live deployment**, which is older than the codebase. Several "critical" items are **already fixed in code** and only need a republish. Below is what's left.

### Already done — skipping
- **Issue 1** (/register 404): all CTAs in `index.tsx` / `login.tsx` / `signup.tsx` already use `/signup`. ✅
- **Issue 3** (review uses textarea): `review.tsx` already uses `@uiw/react-codemirror` with Python/JS/Java/C++ + oneDark. ✅
- **Pricing populated, legal pages, sidebar nav, knowledge graph** — already shipped.

### What I'll build

#### Phase 1 — Account & navigation (the biggest real gap)

1. **`/_authenticated/settings.tsx`** — single page with tabs/sections:
   - **Profile**: edit `profiles.display_name`
   - **Security**: change password via `supabase.auth.updateUser({ password })`
   - **Appearance**: dark/light/system toggle (writes to `localStorage` + `<html class="dark">`; default stays dark)
   - **Data**: link to existing `/settings/export`
   - **Danger zone**: Delete account → server fn `deleteAccount` (admin client deletes `auth.users` row, cascades app data)

2. **`/_authenticated/billing.tsx`** — wire the existing `cancelSubscription` + `getCustomerPortalUrl` server fns:
   - Current plan, status badge, next renewal / access-until date
   - "Manage payment method & invoices" → opens Paddle portal in new tab
   - "Cancel subscription" → confirm dialog → calls `cancelSubscription`, shows "Access until <date>"
   - "Upgrade to Pro" CTA for free users (links to /pricing)

3. **Sidebar update** (`src/routes/_authenticated/route.tsx`):
   - Add **Settings** and **Billing** items below Practice
   - Add a compact footer inside the sidebar: Terms · Privacy · Refunds · Pricing

4. **Public footer reuse**: extract the landing footer into `src/components/site-footer.tsx` so the auth shell can render a thin version too.

#### Phase 2 — Payment UX polish

5. **`?checkout=success` toast** in `src/routes/_authenticated/route.tsx` (or `index.tsx`): reads URL param on mount, shows sonner success toast, strips the param. Update `usePaddleCheckout` successUrl to `${origin}/dashboard?checkout=success`.

6. **Past-due banner** in the auth layout: when `useSubscription().subscription?.status === 'past_due'`, render a top banner linking to the Paddle portal.

#### Phase 3 — Practice "Run code" (Piston)

7. **`src/lib/code-exec.functions.ts`** — `runCode` server fn (auth-required, quota-gated at e.g. 30/day to avoid abuse) that POSTs to `https://emkc.org/api/v2/piston/execute`. Maps `python → python 3.10`, `javascript → node 18`, `java → java 15`, `cpp → c++ 10`.

8. **`practice.tsx`**: add CodeMirror editor + **Run** button (shows stdout/stderr/exit code) + **Submit for AI review** button that calls existing `reviewCode` and navigates to the submission detail page.

#### Phase 4 — Polish

9. **Error UI for failed `reviewCode`**: replace bare toast with an inline error card + Retry button in the review panel.
10. **"← Back to Dashboard"** link on `/review`, `/practice`, `/submission/$id` (small, top-left).
11. **File upload on `/review`**: simple `<input type="file" accept=".py,.js,.ts,.java,.cpp,.c,.h">` that reads into the editor (client-side only, no upload).
12. **Knowledge-graph label wrapping**: fix the cut-off labels by widening the wrap threshold from current word-wrap (the SVG text wraps at ~10 chars). Bump to ~16 and use `<tspan>` for two-line layout.

### Out of scope (confirm if you want any of these)
- Google OAuth (needs Supabase + GCP console work — manual)
- `/profile` separate page (folded into Settings)
- Analytics, telemetry, consent flow

### Technical notes
- Dark/light toggle: Tailwind v4 already supports `dark:` variants; the project is dark-by-default via `<html class="dark">` in `__root.tsx`. Toggle adds/removes the class and persists choice to `localStorage("theme")`. SSR-safe: read in a small inline script in `<head>` to avoid FOUC.
- Delete account: new server fn using `supabaseAdmin.auth.admin.deleteUser(userId)`. RLS cascade handles app tables via `on delete cascade` on `user_id` FKs. Needs to also delete from tables without FK to `auth.users` (e.g. `submissions`, `progress`) — explicit `delete` calls first.
- Piston is unauthenticated and free, but rate-limited; add a `code_run` kind to `usage_counters` with a 30/day cap for everyone (Pro and Free).
- All new routes are under `_authenticated/`, so auth-gating is automatic.

### Test plan (preview)
1. **Settings**: open `/settings`, change display name → reload, verify persists. Change password → log out → log in with new one. Toggle dark/light → reload, persists. Click Delete Account on a throwaway user.
2. **Billing (free user)**: see "No active subscription" + Upgrade CTA. Subscribe via Paddle test card `4242 4242 4242 4242 / 12/30 / 123` → success toast appears on dashboard → /billing now shows active plan.
3. **Cancel**: click Cancel on /billing, confirm → status flips to "Canceled, access until <now+7d>".
4. **Past-due**: simulate by `UPDATE subscriptions SET status='past_due' WHERE user_id=…;` → banner appears.
5. **Run code**: on /practice, paste `print("hi")` → Run → see `hi`. Hit cap 31 times → friendly error.
6. **Review polish**: paste code, force an error (disconnect network) → see error card + Retry.

### Files touched
- **New**: `src/routes/_authenticated/settings.tsx`, `src/routes/_authenticated/billing.tsx`, `src/lib/code-exec.functions.ts`, `src/lib/account.functions.ts` (deleteAccount, updateDisplayName), `src/components/site-footer.tsx`, `src/components/theme-toggle.tsx`, `src/hooks/use-theme.ts`
- **Edit**: `src/routes/_authenticated/route.tsx` (sidebar items, footer, past-due banner, success toast), `src/routes/_authenticated/practice.tsx` (editor + Run + Submit), `src/routes/_authenticated/review.tsx` (file upload, error UI, back link), `src/routes/_authenticated/submission.$submissionId.tsx` (back link), `src/hooks/use-paddle-checkout.ts` (successUrl), `src/lib/entitlements.server.ts` (add `code_run` quota), `src/routes/__root.tsx` (FOUC-safe theme init script)
- **Migration**: none (uses existing `usage_counters`)

Estimate: ~4–5 hours of edits, single batch.
