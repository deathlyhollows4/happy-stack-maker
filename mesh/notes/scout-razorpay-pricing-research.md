Result: Existing checkout already uses Razorpay subscriptions and the failure is caused by missing `billing_plan_mappings` rows for the selected Pro plan codes.
Evidence: Reviewed `src/routes/pricing.tsx`, `src/hooks/use-razorpay-checkout.ts`, `src/lib/payments.functions.ts`, `src/lib/payments.server.ts`, `src/routes/api/public/payments/webhook.ts`, and `supabase/migrations/20260619193000_razorpay_migration_core.sql`.
Changed files: none
Risks: Razorpay connector in this session is read-only and does not expose plan creation or plan listing.
Next: Insert real Razorpay plan IDs for `pro_monthly` and `pro_yearly` in sandbox and live.
