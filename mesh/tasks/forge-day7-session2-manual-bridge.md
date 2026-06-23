# @Forge - Day 7 Session 2 Manual Bridge Integration

## Goal

Add or tighten focused verification proving manual advanced-topic selection creates a guided bridge plus preview, not a random advanced problem.

## Scope

After @Scout and @Sentinel report, implement the smallest required test or behavior fix. Keep changes scoped to planner, generation metadata, recommendation preview, or practice UI bridge view paths only if a verified gap exists.

## File ownership

- Owns: `tests/lib/practice-planner.test.ts`, `tests/lib/practice-generation-plan.test.ts`, `tests/lib/practice-recommendation-view.test.ts`, `tests/lib/practice-problem-view.test.ts`, `tests/lib/practice-structured-problem.test.ts`, `version2_implementation_plan.md`, `mesh/next_session.md`
- May inspect: `src/lib/practice-planner.server.ts`, `src/lib/practice-generation-plan.server.ts`, `src/lib/practice-recommendation-view.ts`, `src/lib/practice-problem-view.ts`, `src/routes/_authenticated/practice.tsx`

## Forbidden files

- `AGENTS.md`
- `CLAUDE.md`
- Supabase migrations unless a source behavior fix requires schema work
- Existing untracked Lovable screenshots, lessons, reference assets, and unrelated mesh task files

## Verification command

`npx vitest run tests\lib\practice-planner.test.ts tests\lib\practice-generation-plan.test.ts tests\lib\practice-recommendation-view.test.ts tests\lib\practice-problem-view.test.ts tests\lib\practice-structured-problem.test.ts`

## Expected summary

Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
