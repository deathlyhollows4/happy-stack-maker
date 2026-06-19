# @Forge - Razorpay Migration

## Goal
Implement the staged migration from Paddle to Razorpay across frontend billing, backend payment flows, and Supabase-backed subscription state.

## Scope
Replace provider-specific checkout, portal, cancellation, webhook, and subscription storage paths while preserving existing plan enforcement and authenticated billing UX.

## File ownership
- Owns: billing and payment integration files under `src/lib/**`, `src/routes/pricing.tsx`, `src/routes/_authenticated/billing.tsx`, `src/routes/api/public/payments/webhook.ts`, `src/hooks/use-subscription.ts`, `src/components/PaymentTestModeBanner.tsx`, `.env.example`, `supabase/migrations/**`, `src/integrations/supabase/types.ts`
- May inspect: admin settings, legal routes, dashboard and entitlements helpers

## Forbidden files
- unrelated learning system files
- unrelated auth files unless required by payment flow

## Verification command
`npm test`

## Expected summary
Result:
Evidence:
Changed files:
Risks:
Next:
