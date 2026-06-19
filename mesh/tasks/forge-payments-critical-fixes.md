# @Forge - Payments Critical Fixes

## Goal
Implement only payment-critical Razorpay fixes needed to capture money and grant Pro only after valid capture or charged subscription.

## Scope
Razorpay order/subscription creation, checkout handling, payment verification, Pro entitlement write paths, and pricing/authenticated payment state.

## File ownership
- Owns: src/lib/payments.server.ts, src/lib/payments.functions.ts, src/hooks/use-razorpay-checkout.ts, src/routes/pricing.tsx, src/routes/_authenticated/route.tsx, supabase/migrations/*payment*.sql if needed
- May inspect: package files, Supabase generated types, existing auth/subscription utilities, mesh notes

## Forbidden files
- Files outside the owned list unless needed for read-only context

## Verification command
npm run build, or narrower static check if build is blocked

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
