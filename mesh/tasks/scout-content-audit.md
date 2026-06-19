# @Scout - Content Audit

## Goal
Find content style violations and misleading user-facing text.

## Scope
Search for banned words, em dashes, false success copy, and legal/payment copy inconsistencies.

## File ownership
- Owns: mesh/notes/scout-content-audit.md
- May inspect: src/routes/**, src/components/**, src/lib/**

## Forbidden files
- src/**
- supabase/**

## Verification command
rg -n "—|unlock|supercharge|lightning-fast|cutting-edge|game-changing|next-level|seamless|best-in-class|world-class|state-of-the-art|leverage|empowers|elevates|transforms|revolutionizes|delve|firstly|secondly|moreover|furthermore|consequently|in conclusion" src

## Expected summary
Result:
Evidence:
Changed files:
Risks:
Next:
