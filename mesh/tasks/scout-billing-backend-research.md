# @Scout - Billing Backend Research

## Goal
Map the current payment provider implementation and define the backend plus schema work required to replace Paddle with Razorpay.

## Scope
Inspect payment server functions, provider wrappers, webhook handling, environment variables, Supabase migrations, generated types, entitlements, and admin flows tied to subscription state.

## File ownership
- Owns: `mesh/tasks/scout-billing-backend-research.md`
- May inspect: `src/lib/billing.functions.ts`, `src/lib/paddle.ts`, `src/lib/paddle.server.ts`, `src/lib/payments.functions.ts`, `src/routes/api/public/payments/webhook.ts`, `src/lib/entitlements.server.ts`, `src/lib/dashboard.functions.ts`, `src/lib/admin.functions.ts`, `src/integrations/supabase/types.ts`, `supabase/migrations/**`, `.env*`

## Forbidden files
- marketing pages unrelated to billing
- visual design assets

## Verification command
read-only task

## Expected summary
Result:
Evidence:
Changed files:
Risks:
Next:
