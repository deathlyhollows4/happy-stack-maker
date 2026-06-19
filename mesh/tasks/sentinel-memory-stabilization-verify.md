# Sentinel - Memory Stabilization Verify

## Goal
Verify that the memory cleanup leaves only the intended manual-mode context artifacts and that repo-specific instructions are restored.

## Scope
Check the changed file set, confirm the local hook artifacts are gone if removed, and re-read `CLAUDE.md` plus representative generated files for final safety notes.

## File ownership
- Owns: `mesh/tasks/sentinel-memory-stabilization-verify.md`
- May inspect: `git status`, `CLAUDE.md`, `.claude/rules/**`, `.claude/hooks/**`, `.claude/settings.json`, `.github/copilot-instructions.md`

## Forbidden files
- `src/**`
- `public/**`
- `supabase/**`
- `tests/**`

## Verification command
`git status --short --branch`

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
