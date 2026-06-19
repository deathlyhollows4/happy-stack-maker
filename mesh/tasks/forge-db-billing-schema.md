# @Forge-DB - Billing Schema Fixes

## Goal
Audit and repair Supabase billing, subscription, webhook event, and plan mapping schema issues.

## Scope
Inspect Supabase migrations and generated Supabase types for billing-related schema drift, missing columns, weak constraints, RLS gaps, idempotency problems, and repair SQL for bad auth-only subscriptions.

## File ownership
- Owns: `supabase/migrations/**`
- Owns: `src/integrations/supabase/types.ts` only if generated type changes are needed
- May inspect: `src/**`, `supabase/**`, `package.json`, `mesh/**`

## Forbidden files
- Files outside the ownership list unless the user explicitly expands this lane
- Other workers' unrelated edits

## Verification command
SQL review, `npm run build` if `src/integrations/supabase/types.ts` changes

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
