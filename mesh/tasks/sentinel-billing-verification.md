# @Sentinel - Billing Verification

## Goal
Verify that the Razorpay migration preserves plan enforcement, subscription state, webhook safety, and billing UX.

## Scope
Run targeted verification for billing routes, subscription helpers, webhook behavior, migrations, and any new environment assumptions.

## File ownership
- Owns: `mesh/tasks/sentinel-billing-verification.md`
- May inspect: all billing-related diffs, tests, migration files, and relevant logs

## Forbidden files
- do not make product copy changes unless required to fix a verified blocker

## Verification command
`npm test`

## Expected summary
Result:
Evidence:
Changed files:
Risks:
Next:
