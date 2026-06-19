# @Forge - Entitlements Audit

## Goal
Ensure Pro state is computed consistently across app surfaces.

## Scope
Review and fix entitlement, quota, dashboard, review, and practice behavior.

## File ownership
- Owns: src/lib/entitlements.server.ts, src/lib/dashboard.functions.ts, src/lib/review.functions.ts, src/lib/practice.functions.ts
- May inspect: src/hooks/use-subscription.ts, src/routes/_authenticated/**

## Forbidden files
- src/lib/payments.functions.ts
- src/lib/payments.server.ts
- supabase/migrations/**

## Verification command
npm run build

## Expected summary
Result:
Evidence:
Changed files:
Risks:
Next:
