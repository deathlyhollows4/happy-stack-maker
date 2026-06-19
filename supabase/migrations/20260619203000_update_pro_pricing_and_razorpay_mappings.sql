-- Updates CodeWise Pro INR pricing.
-- Monthly: INR 899
-- Yearly: INR 8954, a 17% discount from INR 899 * 12
insert into public.app_config (key, value)
values
  ('plan_price_pro_monthly', '899'),
  ('plan_price_pro_yearly', '8954')
on conflict (key) do update
set
  value = excluded.value,
  updated_at = now();

insert into public.billing_plan_mappings (
  provider,
  environment,
  currency_code,
  billing_plan_code,
  provider_plan_id,
  metadata
)
values
  (
    'razorpay',
    'live',
    'INR',
    'pro_monthly',
    'plan_T3ZnEocnpYFQDk',
    '{"display_name":"CodeWise Pro Monthly","amount_inr":899,"interval":"monthly"}'::jsonb
  ),
  (
    'razorpay',
    'live',
    'INR',
    'pro_yearly',
    'plan_T3ZrPwyv3jpRE4',
    '{"display_name":"CodeWise Pro Yearly","amount_inr":8954,"interval":"yearly"}'::jsonb
  )
on conflict (provider, environment, currency_code, billing_plan_code) do update
set
  provider_plan_id = excluded.provider_plan_id,
  metadata = excluded.metadata,
  updated_at = now();

-- Required before live checkout works:
-- 1. Keep the Razorpay plan display or description branded as CodeWise.
-- 2. Add sandbox mappings only if you want test-mode checkout.
--
-- Uncomment after replacing the sandbox IDs:
--
-- insert into public.billing_plan_mappings (
--   provider,
--   environment,
--   currency_code,
--   billing_plan_code,
--   provider_plan_id,
--   metadata
-- )
-- values
--   (
--     'razorpay',
--     'sandbox',
--     'INR',
--     'pro_monthly',
--     'plan_REPLACE_WITH_SANDBOX_MONTHLY_ID',
--     '{"display_name":"CodeWise Pro Monthly","amount_inr":899,"interval":"monthly"}'::jsonb
--   ),
--   (
--     'razorpay',
--     'sandbox',
--     'INR',
--     'pro_yearly',
--     'plan_REPLACE_WITH_SANDBOX_YEARLY_ID',
--     '{"display_name":"CodeWise Pro Yearly","amount_inr":8954,"interval":"yearly"}'::jsonb
--   )
-- on conflict (provider, environment, currency_code, billing_plan_code) do update
-- set
--   provider_plan_id = excluded.provider_plan_id,
--   metadata = excluded.metadata,
--   updated_at = now();
