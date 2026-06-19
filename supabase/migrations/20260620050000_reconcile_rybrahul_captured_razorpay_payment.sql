insert into public.subscriptions (
  user_id,
  provider,
  provider_subscription_id,
  provider_customer_id,
  provider_plan_id,
  billing_plan_code,
  price_id,
  product_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  currency_code,
  environment,
  external_status_updated_at,
  metadata,
  updated_at
)
values (
  'c2788145-ac3a-4b58-a3c2-a11c21a9f191',
  'razorpay',
  'order_T3f0eXCfBSR4oA',
  null,
  'pro_monthly',
  'pro_monthly',
  'pro_monthly',
  'pro',
  'active',
  to_timestamp(1781909612),
  to_timestamp(1781909612) + interval '1 month',
  false,
  'INR',
  'live',
  to_timestamp(1781909612),
  jsonb_build_object(
    'source', 'razorpay_manual_reconciliation',
    'checkout_mode', 'order',
    'razorpay_order_id', 'order_T3f0eXCfBSR4oA',
    'razorpay_payment_id', 'pay_T3f5DlCVRmyDM1',
    'razorpay_payment_status', 'captured',
    'razorpay_payment_amount', 89900,
    'razorpay_payment_captured', true,
    'expected_amount', 89900,
    'amount_matches', true,
    'currency_matches', true,
    'reconciled_reason', 'captured_payment_not_reflected_in_subscription_state'
  ),
  now()
)
on conflict (provider, environment, provider_subscription_id)
do update set
  user_id = excluded.user_id,
  provider_plan_id = excluded.provider_plan_id,
  billing_plan_code = excluded.billing_plan_code,
  price_id = excluded.price_id,
  product_id = excluded.product_id,
  status = excluded.status,
  current_period_start = case
    when public.subscriptions.current_period_start is not null
      then public.subscriptions.current_period_start
    else excluded.current_period_start
  end,
  current_period_end = case
    when public.subscriptions.current_period_end is not null
     and public.subscriptions.current_period_end > now()
      then public.subscriptions.current_period_end
    else excluded.current_period_end
  end,
  cancel_at_period_end = false,
  currency_code = excluded.currency_code,
  external_status_updated_at = greatest(
    coalesce(public.subscriptions.external_status_updated_at, '-infinity'::timestamptz),
    excluded.external_status_updated_at
  ),
  metadata = coalesce(public.subscriptions.metadata, '{}'::jsonb) || excluded.metadata,
  updated_at = now()
where
  excluded.user_id = 'c2788145-ac3a-4b58-a3c2-a11c21a9f191'
  and excluded.provider_subscription_id = 'order_T3f0eXCfBSR4oA'
  and excluded.currency_code = 'INR'
  and excluded.billing_plan_code = 'pro_monthly'
  and (excluded.metadata->>'razorpay_payment_id') = 'pay_T3f5DlCVRmyDM1'
  and (excluded.metadata->>'razorpay_payment_amount')::integer = 89900
  and (excluded.metadata->>'razorpay_payment_captured')::boolean = true;
