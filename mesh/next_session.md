# Next Session

## Objective
Plan and execute the CodeWise billing migration from Paddle to Razorpay, including billing UI, backend payment flows, Supabase schema changes, and India-market pricing analysis.

## Current status
- Agent Mesh routing is active for this mission.
- The current codebase still uses Paddle across frontend checkout, backend server functions, webhook ingestion, legal copy, environment variables, and Supabase subscription records.
- Three research lanes were spawned for this plan:
  - `@Scout` billing frontend and pricing surface review
  - `@Scout` billing backend, payments flow, and Supabase schema review
  - `@Scout` unit-economics review for current Pro quotas against DeepSeek pricing
- Parent-thread local inspection already confirmed active Paddle touchpoints in:
  - `src/routes/pricing.tsx`
  - `src/routes/_authenticated/billing.tsx`
  - `src/lib/billing.functions.ts`
  - `src/lib/paddle.ts`
  - `src/lib/payments.functions.ts`
  - `src/routes/api/public/payments/webhook.ts`
  - `src/hooks/use-subscription.ts`
  - `supabase/migrations/20260516215054_7f167ee8-3708-4ff2-99cf-edcbfa9489fc.sql`
  - `supabase/migrations/20260518000000_app_config.sql`

## Commands run
- `Get-ChildItem -Force`
- `rg -n "billing|subscription|plan|razorpay|payment|credits|usage|limit|pro plan" src supabase tests package.json README.md`
- `Get-Content -Raw README.md`
- `Get-Content -Raw src/lib/billing.functions.ts`
- `Get-Content -Raw src/routes/_authenticated/billing.tsx`
- `Get-Content -Raw src/routes/api/public/payments/webhook.ts`
- `Get-Content -Raw src/routes/pricing.tsx`
- `Get-Content -Raw src/lib/paddle.ts`
- `Get-Content -Raw src/lib/payments.functions.ts`
- `Get-Content -Raw .env.example`

## Changed files
- `mesh/next_session.md`
- `mesh/tasks/scout-billing-ux-research.md`
- `mesh/tasks/scout-billing-backend-research.md`
- `mesh/tasks/scout-unit-economics-research.md`
- `mesh/tasks/forge-razorpay-migration.md`
- `mesh/tasks/sentinel-billing-verification.md`

## Open risks
- The exact user phrase `deep-seek v4 flash extra high` may not match an official SKU, so the economics lane must pin the closest official DeepSeek pricing page and state the assumption clearly.
- Razorpay connector tools in this session are read-only account-inspection tools, so implementation will still require code changes and direct API integration in the app.
- Existing `subscriptions` schema is Paddle-shaped and may need either a generalized provider model or a clean provider-specific replacement with data migration handling.
- Supabase changes will need security review for RLS and webhook idempotency before rollout.

## Resume steps
1. Wait for the three Scout lanes and integrate their summaries.
2. Convert the integrated research into a staged implementation plan with disjoint write scopes.
3. Before editing any existing function, class, or method during implementation, run the required GitNexus impact analysis per `AGENTS.md`.
4. Use Supabase project tooling only after identifying the correct project ref and after the user approves any branch or migration operations that incur cost or touch live data.
