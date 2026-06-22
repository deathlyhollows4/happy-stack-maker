# @Forge - Day 4 Session 5 Bridge Preview

## Goal

Implement Day 4 Session 5 bridge and preview messaging for manual topics that are above the learner's current mastery.

## Scope

Add the narrowest code and tests needed to surface guided bridge context in the practice UI while preserving existing generated problem behavior.

## File ownership

- Owns: `src/routes/_authenticated/practice.tsx`, any narrow helper or model file required for bridge preview view data, focused tests for the helper/UI model, `version2_implementation_plan.md`
- May inspect: `src/lib/**`, `tests/lib/**`, `supabase/migrations/**`

## Forbidden files

- Do not edit Supabase migrations unless the implementation proves a schema field is missing.
- Do not edit unrelated billing, auth, or marketing routes.

## Verification command

`npx vitest run <focused tests>`

## Expected summary

Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:

## Worker summary

Result: Bridge preview messaging now appears only when persisted planner metadata says a manual topic request was bridged to a prerequisite node.
Evidence: Updated generation planning, structured insert payloads, Supabase types, migration SQL, the practice view model, the practice route, and focused tests; related tests and scoped lint passed.
Changed files: `src/lib/practice-generation-plan.server.ts`, `src/lib/practice-structured-problem.server.ts`, `src/lib/practice-problem-view.ts`, `src/routes/_authenticated/practice.tsx`, `src/integrations/supabase/types.ts`, `tests/lib/practice-generation-plan.test.ts`, `tests/lib/practice-structured-problem.test.ts`, `tests/lib/practice-problem-view.test.ts`, `tests/lib/practice-event-model.test.ts`, `supabase/migrations/20260622170000_add_practice_planning_context.sql`
Risks: The migration has been created but not applied.
Next: Run full tests, build, final GitNexus detect changes, then commit.
