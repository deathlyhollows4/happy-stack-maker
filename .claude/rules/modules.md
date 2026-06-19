# Module Map

## `src/routes/`
- 39 route files.
- Public marketing and content pages: `/`, `/pricing`, `/blog`, `/explore`, `/learn`, `/privacy`, `/terms`, `/refunds`.
- Auth pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`.
- Authenticated app: dashboard, review, practice, billing, settings, submission detail.
- Admin area: dashboard, blog, curriculum, research, export, seats, settings, update-price.
- API-like routes: `/health`, `/sitemap.xml`, `/api/public/og/$submissionId`, `/api/public/payments/webhook`.

## `src/lib/`
- 23 domain files built mostly around TanStack Start server functions.
- Core product logic:
  - `review.functions.ts` - AI review, submission fetch, public share fetch
  - `dashboard.functions.ts` - dashboard data, topic lookup, entitlements, user export
  - `practice.functions.ts` - generate and list practice problems
  - `billing.functions.ts` and `payments.functions.ts` - subscription actions and price resolution
  - `admin.functions.ts` - admin dashboard, roles, curriculum, export, app config
  - `account.functions.ts` and `consent.functions.ts` - profile, avatar, consent, research events
- Support logic:
  - `entitlements.server.ts` - plan detection and quota RPC helpers
  - `paddle.server.ts` and `paddle.ts` - Paddle integration
  - `codewise.utils.ts` - parsing and FSRS helpers
  - `review.constants.ts` - prompts, schemas, valid topics

## `src/integrations/supabase/`
- `client.ts` for browser usage
- `client.server.ts` for service-role access
- `auth-middleware.ts` to reconstruct an authenticated Supabase client for server functions
- `auth-attacher.ts` for function middleware
- `types.ts` generated database typing

## `src/components/`
- 24 component files.
- Shared site chrome: `site-header.tsx`, `site-footer.tsx`, `consent-banner.tsx`
- Product UI: review queue, onboarding modal, editor settings, analytics tracker, knowledge graph
- UI primitives under `src/components/ui/`

## `src/hooks/`
- Auth state, subscription state, Paddle checkout, telemetry, theme, mobile detection

## `supabase/migrations/`
- Schema and policy evolution for subscriptions, quotas, roles, blog, consent, research, avatars, curriculum mappings, webhook events

## `scripts/`
- `scripts/eval.ts` for review-evaluation workflows
- `scripts/update-yearly-price.ts` for pricing maintenance
- `scripts/corpus/labelled-errors.csv` for evaluation data

## `tests/`
- 5 test files checked into the repo
- Unit coverage under `tests/lib/`
- Playwright critical path under `tests/e2e/critical-path.spec.ts`
