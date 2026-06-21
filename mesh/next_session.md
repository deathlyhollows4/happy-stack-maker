# Razorpay Pricing Integration Handoff

## Objective
Fix missing Razorpay plan mappings on the pricing page, update Pro pricing to INR 899 monthly with a matching annual price that keeps a yearly discount, and provide migration code.

## Current status
- Routed through Agent Mesh file-backed lanes because no real subagent tool is available in this turn.
- Created @Scout, @Forge, @Sentinel, and @Cipher lane files under `mesh/tasks/`.
- Updated pricing defaults to INR 899 monthly and INR 8954 yearly.
- Added migration `supabase/migrations/20260619203000_update_pro_pricing_and_razorpay_mappings.sql` with app config updates and Razorpay plan mapping template.
- Build passed after rerunning outside the sandbox.
- @Forge-Payments lane added a payment ownership guard in Razorpay subscription verification.

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
- `npx gitnexus impact "Function:src/lib/payments.functions.ts:verifyRazorpaySubscriptionPayment" --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact "Const:src/lib/payments.functions.ts:verifyRazorpaySubscriptionPayment" --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact verifyRazorpayPaymentSignature --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npm run build`

## Changed files
- `mesh/tasks/scout-razorpay-pricing-research.md`
- `mesh/tasks/forge-razorpay-checkout.md`
- `mesh/tasks/sentinel-razorpay-verification.md`
- `mesh/tasks/cipher-razorpay-security-review.md`
- `mesh/tasks/scout-payments-correctness.md`
- `mesh/tasks/forge-payments-critical-fixes.md`
- `mesh/tasks/sentinel-payments-verification.md`
- `mesh/next_session.md`
- `mesh/notes/scout-razorpay-pricing-research.md`
- `mesh/notes/sentinel-razorpay-verification.md`
- `mesh/notes/cipher-razorpay-security-review.md`
- `.env.example`
- `src/lib/payments.ts`
- `src/lib/payments.functions.ts`
- `src/lib/billing.functions.ts`
- `supabase/migrations/20260518000000_app_config.sql`
- `supabase/migrations/20260619203000_update_pro_pricing_and_razorpay_mappings.sql`

## Open risks
- `gitnexus detect-changes` could not complete because the CLI command timed out in this lane.
- Real Razorpay plan IDs must be created or copied from Razorpay and inserted into `billing_plan_mappings`.
- Razorpay account display or business profile must be configured as CodeWise in the Razorpay dashboard so hosted payment surfaces do not show the personal name.
- Real Razorpay webhook delivery and live payment capture were not exercised locally.

## Resume steps
1. Replace the placeholder plan IDs in the provided migration SQL with real Razorpay plan IDs.
2. Apply the migration.
3. Configure production `VITE_RAZORPAY_KEY_ID` to the live key ID and server Razorpay live secrets.
4. Configure the Razorpay webhook URL and secret.
5. Run `gitnexus detect-changes` from a trusted local install before commit if available.
6. Exercise a real Razorpay sandbox subscription checkout and confirm the webhook updates the subscription to `active` only after `subscription.activated` or `subscription.charged`.

---

# Architecture Report Fix Handoff

## Objective
Fix the architecture issues identified in `C:\Users\brawl\AppData\Local\Temp\architecture-review-20260621-075455.html`.

## Current status
- Routed through Agent Mesh file-backed lanes because the user explicitly invoked `agent-mesh`.
- Created @Scout, @Forge, and @Sentinel lane files for inspection, implementation, and verification.
- Added shared entitlement, Razorpay lifecycle, AI workflow, admin route, and code workspace seams.
- Wired existing server functions, hooks, admin routes, review, practice, and webhook code through those seams.
- Added focused unit tests for entitlement policy, Razorpay lifecycle policy, and AI workflow retry/error handling.
- GitNexus final change detection reports CRITICAL risk: 17 tracked files, 90 symbols, 48 affected processes.
- `npm test`, `npm run build`, and touched-file Prettier checks pass.
- Repo-wide `npm run lint` still fails on existing baseline issues, mostly CRLF/prettier errors outside this change plus a few pre-existing type lint issues.

## Commands run
- `Get-Content -LiteralPath 'C:\Users\brawl\.agents\skills\agent-mesh\SKILL.md'`
- `Get-Content -LiteralPath 'C:\Users\brawl\.agents\skills\agent-mesh\references\dispatch-patterns.md'`
- `Get-Content -LiteralPath 'C:\Users\brawl\.agents\skills\agent-mesh\references\worker-summary-contract.md'`
- `Get-Content -LiteralPath 'C:\Users\brawl\.agents\skills\agent-mesh\references\verification-checklist.md'`
- `Get-ChildItem -Force -LiteralPath 'mesh' -ErrorAction SilentlyContinue`
- `Get-ChildItem -Force -LiteralPath 'mesh\tasks' -ErrorAction SilentlyContinue`
- `Get-Content -LiteralPath 'mesh\next_session.md' -Tail 80`
- `npx gitnexus impact getUserPlan --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact useSubscription --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact "Function:src/lib/payments.functions.ts:verifyRazorpaySubscriptionPayment" --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact "Function:src/lib/review.functions.ts:reviewCode" --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact "Function:src/lib/practice.functions.ts:generatePractice" --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact Review --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact Practice --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact ProblemWorkspace --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact handleOrderPaymentCaptured --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus impact upsertSubscriptionFromWebhook --direction upstream --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npx gitnexus detect-changes --repo "C:\Users\brawl\OneDrive\Documents\GOATEDDD\CodeWise\happy-stack-maker"`
- `npm test`
- `npm run build`
- `npm run lint`
- `npx prettier --check <touched files>`

## Changed files
- `mesh/tasks/scout-architecture-report-inspection.md`
- `mesh/tasks/forge-architecture-report-fix.md`
- `mesh/tasks/sentinel-architecture-report-verify.md`
- `mesh/next_session.md`
- `src/lib/entitlement-policy.ts`
- `src/lib/razorpay-lifecycle.server.ts`
- `src/lib/ai-workflow.server.ts`
- `src/lib/admin-route.ts`
- `src/components/code-workspace.tsx`
- `src/lib/entitlements.server.ts`
- `src/hooks/use-subscription.ts`
- `src/lib/payments.functions.ts`
- `src/lib/practice.functions.ts`
- `src/lib/review.functions.ts`
- `src/routes/api/public/payments/webhook.ts`
- `src/routes/_authenticated/review.tsx`
- `src/routes/_authenticated/practice.tsx`
- `src/routes/_authenticated/admin.dashboard.tsx`
- `src/routes/_authenticated/admin.blog.tsx`
- `src/routes/_authenticated/admin.seats.tsx`
- `src/routes/_authenticated/admin.settings.tsx`
- `src/routes/_authenticated/admin.curriculum.tsx`
- `src/routes/_authenticated/admin.research.tsx`
- `src/routes/_authenticated/admin.export.tsx`
- `src/routes/_authenticated/admin.update-price.tsx`
- `tests/lib/entitlement-policy.test.ts`
- `tests/lib/razorpay-lifecycle.test.ts`
- `tests/lib/ai-workflow.test.ts`

## Open risks
- GitNexus final risk is CRITICAL because shared subscription, auth layout, pricing, practice workspace, and Razorpay verification flows are touched.
- Real Razorpay webhook delivery and live payment capture were not exercised locally.
- Playwright authenticated editor/admin flows were not run because they require a local logged-in/auth setup.
- Repo-wide lint remains red on pre-existing formatting/type baseline outside this architecture slice.
- `src/routeTree.gen.ts` was already modified in the working tree and was not edited by this architecture slice.

## Resume steps
1. Review the CRITICAL GitNexus change scope before committing.
2. Run local authenticated smoke checks for review, practice, admin routes, and Razorpay sandbox checkout if credentials are available.
3. Decide whether to accept or split this architecture slice before staging.
4. Clean the pre-existing repo-wide lint baseline separately if lint is required as a merge gate.
