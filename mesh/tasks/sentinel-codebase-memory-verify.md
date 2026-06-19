# Sentinel - Codebase Memory Verification

## Goal
Verify the cleanup scope, generated files, and whether Codebase Memory outputs look repo-specific and safe.

## Scope
Compare pre and post analysis file state, inspect generated AI-context files, and report risks without editing source code.

## File ownership
- Owns: `mesh/tasks/sentinel-codebase-memory-verify.md`
- May inspect: `.gitnexus/`, `CLAUDE.md`, `.claude/rules/**`, other generated AI-context files, `git status`

## Forbidden files
- `src/**`
- `app/**`
- `components/**`
- `pages/**`

## Verification command
`git status --short --branch`

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
