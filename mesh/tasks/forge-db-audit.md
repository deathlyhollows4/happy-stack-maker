# @Forge - Database Audit

## Goal
Fix database schema, migration, and idempotency issues for billing and app state.

## Scope
Review Supabase migrations, billing plan mappings, subscriptions, webhook events, RLS, and generated types.

## File ownership
- Owns: supabase/migrations/**, src/integrations/supabase/types.ts
- May inspect: src/lib/**, src/routes/api/**

## Forbidden files
- src/lib/payments.functions.ts
- src/lib/payments.server.ts

## Verification command
npm run build

## Expected summary
Result:
Evidence:
Changed files:
Risks:
Next:
