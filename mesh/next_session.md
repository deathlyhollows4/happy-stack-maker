# Razorpay Pricing Integration Handoff

## Objective
Fix missing Razorpay plan mappings on the pricing page, update Pro pricing to INR 899 monthly with a matching annual price that keeps a yearly discount, and provide migration code.

## Current status
- Routed through Agent Mesh file-backed lanes because no real subagent tool is available in this turn.
- Created @Scout, @Forge, @Sentinel, and @Cipher lane files under `mesh/tasks/`.
- Updated pricing defaults to INR 899 monthly and INR 8954 yearly.
- Added migration `supabase/migrations/20260619203000_update_pro_pricing_and_razorpay_mappings.sql` with app config updates and Razorpay plan mapping template.
- Build passed after rerunning outside the sandbox.

## Commands run
- `Get-Content C:\Users\brawl\.agents\skills\agent-mesh\SKILL.md`
- `Get-Content C:\Users\brawl\.agents\skills\agent-mesh\references\dispatch-patterns.md`
- `Get-Content C:\Users\brawl\.agents\skills\agent-mesh\references\worker-summary-contract.md`
- `Get-Content C:\Users\brawl\.agents\skills\agent-mesh\references\verification-checklist.md`
- `npx gitnexus impact PricingPage --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact DEFAULT_PRICING_CONFIG --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact normalizePricingConfig --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact "Function:src/lib/payments.functions.ts:createSubscriptionCheckout" --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact useRazorpayCheckout --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact "Function:src/lib/billing.functions.ts:updateProYearlyPrice" --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npm run build`

## Changed files
- `mesh/tasks/scout-razorpay-pricing-research.md`
- `mesh/tasks/forge-razorpay-checkout.md`
- `mesh/tasks/sentinel-razorpay-verification.md`
- `mesh/tasks/cipher-razorpay-security-review.md`
- `mesh/next_session.md`
- `mesh/notes/scout-razorpay-pricing-research.md`
- `mesh/notes/sentinel-razorpay-verification.md`
- `mesh/notes/cipher-razorpay-security-review.md`
- `.env.example`
- `src/lib/payments.ts`
- `src/lib/billing.functions.ts`
- `supabase/migrations/20260518000000_app_config.sql`
- `supabase/migrations/20260619203000_update_pro_pricing_and_razorpay_mappings.sql`

## Open risks
- `gitnexus detect-changes` could not complete because `npx` attempted npm cache or registry access, and unsandboxed execution was rejected for safety.
- Real Razorpay plan IDs must be created or copied from Razorpay and inserted into `billing_plan_mappings`.
- Razorpay account display or business profile must be configured as CodeWise in the Razorpay dashboard so hosted payment surfaces do not show the personal name.

## Resume steps
1. Replace the placeholder plan IDs in the provided migration SQL with real Razorpay plan IDs.
2. Apply the migration.
3. Configure production `VITE_RAZORPAY_KEY_ID` to the live key ID and server Razorpay live secrets.
4. Configure the Razorpay webhook URL and secret.
5. Run `gitnexus detect-changes` from a trusted local install before commit if available.
