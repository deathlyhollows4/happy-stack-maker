# Next Session

## Objective
Plan and execute the CodeWise billing migration from Paddle to Razorpay, including billing UI, backend payment flows, Supabase schema changes, and India-market pricing analysis.

## Current status
- Agent Mesh routing is active for this mission.
- Backend and frontend migration code is in place for Razorpay.
- The checkout flow now creates Razorpay subscriptions through server functions, opens `checkout.js`, and verifies the signed payment response before redirecting.
- Provider-neutral subscription fields, webhook idempotency fields, and `billing_plan_mappings` were added in `supabase/migrations/20260619193000_razorpay_migration_core.sql`.
- Pricing, billing, admin pricing guidance, refund policy, privacy notice, and terms were updated for INR and Razorpay.
- Local verification passed:
  - `npm run build`
  - `npm test`
- GitNexus `detect-changes` reported `critical`, but that result reflects the full in-flight working tree across 33 files, including non-billing edits already present in the repo.

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
- `npx gitnexus analyze`
- `npx gitnexus impact -r "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker" ...`
- `npm run build`
- `npm test`
- `npx gitnexus detect-changes -r "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`

## Changed files
- `mesh/next_session.md`
- `mesh/tasks/scout-billing-ux-research.md`
- `mesh/tasks/scout-billing-backend-research.md`
- `mesh/tasks/scout-unit-economics-research.md`
- `mesh/tasks/forge-razorpay-migration.md`
- `mesh/tasks/sentinel-billing-verification.md`
- `supabase/migrations/20260619193000_razorpay_migration_core.sql`
- `src/lib/payments.server.ts`
- `src/lib/payments.ts`
- `src/lib/payments.functions.ts`
- `src/lib/billing.functions.ts`
- `src/lib/entitlements.server.ts`
- `src/lib/code-exec.functions.ts`
- `src/lib/codewise.utils.ts`
- `src/hooks/use-razorpay-checkout.ts`
- `src/hooks/use-subscription.ts`
- `src/routes/pricing.tsx`
- `src/routes/_authenticated/billing.tsx`
- `src/routes/_authenticated/practice.tsx`
- `src/routes/_authenticated/review.tsx`
- `src/routes/_authenticated/admin.settings.tsx`
- `src/routes/_authenticated/admin.update-price.tsx`
- `src/routes/api/public/payments/webhook.ts`
- `src/routes/terms.tsx`
- `src/routes/refunds.tsx`
- `src/routes/privacy.tsx`
- `src/components/PaymentTestModeBanner.tsx`
- `src/integrations/supabase/types.ts`
- `.env.example`
- `src/server.ts`

## Open risks
- The Supabase migration has been added but not applied from this session.
- `billing_plan_mappings` must be seeded with real Razorpay plan IDs for each environment before checkout can succeed.
- Razorpay webhook configuration must point to `/api/public/payments/webhook?env=sandbox` or `?env=live` with the matching secret.
- Legacy Paddle files may still exist on disk, but the active billing UI and server flows have been migrated. Remove any now-dead files and dependencies in a cleanup pass after the rollout is stable.
- GitNexus change detection is broad because the working tree already contains other in-flight edits outside the core Razorpay lane.

## Resume steps
1. Apply `supabase/migrations/20260619193000_razorpay_migration_core.sql` to the target Supabase project.
2. Seed `billing_plan_mappings` with the real Razorpay plan IDs for `pro_monthly` and `pro_yearly` in `sandbox` and `live`.
3. Set all Razorpay env vars in deployment, including webhook secrets and `VITE_RAZORPAY_KEY_ID`.
4. Configure the Razorpay webhook endpoint and run one sandbox checkout end to end.
5. After production confirmation, remove dead Paddle files and any unused dependency entries in a separate cleanup change.
