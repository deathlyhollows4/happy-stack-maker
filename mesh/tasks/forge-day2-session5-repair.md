# Forge - Day 2 Session 5 Repair Retry

## Goal

Add one structured-generation repair retry and prevent weak practice problems from being stored when repair fails.

## Scope

Implement the repair workflow around strict JSON practice generation.

## File ownership

- Owns: `src/lib/practice-generation-repair.server.ts`
- Owns: `src/lib/practice.functions.ts`
- Owns: `tests/lib/practice-generation-repair.test.ts`
- May inspect: `src/lib/ai-workflow.server.ts`, `src/lib/practice-problem-contract.ts`, `src/lib/practice-structured-problem.server.ts`

## Forbidden files

- `version2_implementation_plan.md`
- `tests/lib/practice-planner.test.ts`
- `tests/lib/practice-generation-plan.test.ts`
- `supabase/migrations/**`
- `src/integrations/supabase/types.ts`

## Verification command

`npx vitest run tests\lib\practice-generation-repair.test.ts`

## Expected summary

Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
