# @Prime - Learning System Routing

## Goal
Implement the plan items that tighten topic slugs, learn pages, review mapping, and practice generation.

## Scope
Create a canonical topic model, align public and authenticated topic selectors, deepen learn pages, and strengthen practice prompts.

## File ownership
- Owns: `src/lib/topics.ts`, `src/lib/review.constants.ts`, `src/lib/practice.functions.ts`, `src/routes/learn.index.tsx`, `src/routes/learn.$slug.tsx`, `src/routes/_authenticated/practice.tsx`, `src/routes/_authenticated/submission.$submissionId.tsx`, `src/components/knowledge-graph.tsx`
- May inspect: `src/lib/codewise.utils.ts`, `src/lib/review.functions.ts`, `src/routes/_authenticated/dashboard.tsx`, `src/components/review-queue.tsx`

## Forbidden files
- `src/routes/index.tsx`
- `src/routes/pricing.tsx`
- `src/routes/signup.tsx`
- `src/routes/login.tsx`
- `src/server.ts`

## Child lanes allowed
- @Scout: slug map and current flow analysis
- @Forge: canonical topic module and UI integration
- @Maven: lesson content structure
- @Sentinel: type/build verification

## Verification command
`npm run build`

## Expected summary
Result:
Evidence:
Changed files:
Risks:
Next:
