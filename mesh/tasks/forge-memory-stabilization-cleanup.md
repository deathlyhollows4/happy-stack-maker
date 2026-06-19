# Forge - Memory Stabilization Cleanup

## Goal
Preserve the useful memory artifacts while restoring repo-specific AI guidance and removing unwanted manual-mode side effects.

## Scope
Edit `CLAUDE.md` to combine existing repo guidance with a narrow Codebase Memory note, and remove local hook artifacts that were created by `analyze`.

## File ownership
- Owns: `CLAUDE.md`, `.claude/hooks/**`, `.claude/settings.json`, `mesh/next_session.md`
- May inspect: `AGENTS.md`, `.claude/rules/**`, `.github/copilot-instructions.md`

## Forbidden files
- `src/**`
- `public/**`
- `supabase/**`
- `tests/**`

## Verification command
`git diff -- CLAUDE.md`

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
