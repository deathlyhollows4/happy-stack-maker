# Forge - Codebase Memory Setup

## Goal
Remove only GitNexus analyzer artifacts, then run Codebase Memory analysis from the repo root in manual mode.

## Scope
Execute the approved cleanup path, verify the `codebase-memory` CLI is available, and run `codebase-memory analyze .` without touching application source files unless generation requires it.

## File ownership
- Owns: `.gitnexus/**`, generated AI-context files, `mesh/next_session.md`
- May inspect: repo root metadata, `CLAUDE.md`, `.claude/**`

## Forbidden files
- `src/**`
- `app/**`
- `components/**`
- `pages/**`

## Verification command
`codebase-memory analyze .`

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
