# @Forge-Entitlements - Entitlement And Quota Consistency

## Goal
Implement focused fixes so Pro status and quota behavior use the same entitlement source across owned server functions.

## Scope
Audit dashboard, review, practice, billing, and admin entitlement behavior, then edit only the owned implementation files needed for consistency.

## File ownership
- Owns: src/lib/entitlements.server.ts, src/lib/dashboard.functions.ts, src/lib/review.functions.ts, src/lib/practice.functions.ts, related tests if any
- May inspect: related billing/admin files and tests

## Forbidden files
- Unrelated routes, components, copy, config, generated files, dependency files

## Verification command
npm run build

## Expected summary
Use the worker summary contract:
Result:
Evidence:
Changed files:
Risks:
Next:
