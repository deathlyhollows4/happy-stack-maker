# @Scout - DB Schema Audit

## Goal
Map existing billing-related migrations and identify schema, RLS, and idempotency risks before implementation.

## Scope
Read-only audit of billing, subscriptions, webhook events, plan mappings, and any repair migration logic.

## File ownership
- Owns: none
- May inspect: `supabase/migrations/**`, `src/integrations/supabase/types.ts`, billing-related source files

## Forbidden files
- Do not edit files

## Verification command
read-only task

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
