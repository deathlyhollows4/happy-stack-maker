# @Scout - Payments Correctness Review

## Goal
Determine whether the Razorpay integration captures money and grants Pro only after valid capture or charged subscription.

## Scope
Read-only inspection of payment routes, server functions, hooks, pricing UI, authenticated entitlement gating, and payment migrations.

## File ownership
- Owns: mesh/notes/scout-payments-correctness.md
- May inspect: src/lib/payments.server.ts, src/lib/payments.functions.ts, src/hooks/use-razorpay-checkout.ts, src/routes/pricing.tsx, src/routes/_authenticated/route.tsx, supabase/migrations/*payment*.sql

## Forbidden files
- All source files except mesh/notes/scout-payments-correctness.md

## Verification command
read-only task

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
