# @Sentinel - DB Verification

## Goal
Verify any database lane changes match declared ownership and do not introduce build or schema review regressions.

## Scope
Review changed SQL and generated types, check git status, run required verification commands, and confirm changed files stay in the DB lane ownership.

## File ownership
- Owns: none
- May inspect: `supabase/migrations/**`, `src/integrations/supabase/types.ts`, `package.json`, changed files

## Forbidden files
- Do not edit files

## Verification command
`git status --short`; SQL review; `npm run build` if `src/integrations/supabase/types.ts` changes

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
