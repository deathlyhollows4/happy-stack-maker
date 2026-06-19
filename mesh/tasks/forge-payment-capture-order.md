# @Forge - Payment Capture Order

## Goal
Make Razorpay checkout collect real money before granting Pro access.

## Scope
Replace mandate-only subscription success with server-verified captured Razorpay order payments for Pro Monthly and Pro Yearly.

## File ownership
- Owns: src/lib/payments.server.ts, src/lib/payments.functions.ts, src/hooks/use-razorpay-checkout.ts, src/routes/pricing.tsx
- May inspect: src/lib/payments.ts, supabase/migrations/**

## Forbidden files
- src/lib/entitlements.server.ts
- src/routes/_authenticated/admin.dashboard.tsx
- node_modules/**

## Verification command
npm run build

## Expected summary
Result:
Evidence:
Changed files:
Risks:
Next:
