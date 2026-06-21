# Sentinel - Day 2 Session 6 Coverage

## Goal

Verify Day 2 Session 6 coverage for manual bridge behavior, auto weakest topic behavior, repair success, and repair failure.

## Scope

Review existing planner and generation-plan tests, add only missing planner or generation-plan tests if required, and report whether repair tests are covered by the Forge lane.

## File ownership

- Owns: `tests/lib/practice-planner.test.ts`
- Owns: `tests/lib/practice-generation-plan.test.ts`
- May inspect: `src/lib/practice-planner.server.ts`, `src/lib/practice-generation-plan.server.ts`, `src/lib/practice-generation-repair.server.ts`, `tests/lib/practice-generation-repair.test.ts`

## Forbidden files

- `src/lib/practice.functions.ts`
- `src/lib/practice-generation-repair.server.ts`
- `tests/lib/practice-generation-repair.test.ts`
- `version2_implementation_plan.md`
- `supabase/migrations/**`
- `src/integrations/supabase/types.ts`

## Verification command

`npx vitest run tests\lib\practice-planner.test.ts tests\lib\practice-generation-plan.test.ts tests\lib\practice-generation-repair.test.ts`

## Expected summary

Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
