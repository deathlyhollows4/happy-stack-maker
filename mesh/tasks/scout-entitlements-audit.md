# @Scout - Entitlements Audit

## Goal
Map how Pro status and quota state are computed across dashboard, review, practice, billing, and admin.

## Scope
Inspect entitlement and quota reads, especially Pro checks, remaining quota calculations, billing metadata, and admin overrides.

## File ownership
- Owns: none
- May inspect: src/lib/entitlements.server.ts, src/lib/dashboard.functions.ts, src/lib/review.functions.ts, src/lib/practice.functions.ts, related billing/admin files, related tests

## Forbidden files
- Any source edits

## Verification command
read-only task

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
