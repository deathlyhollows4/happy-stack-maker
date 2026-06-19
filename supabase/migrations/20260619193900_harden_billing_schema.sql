alter table public.billing_plan_mappings enable row level security;

revoke all on public.billing_plan_mappings from anon, authenticated;
grant all on public.billing_plan_mappings to service_role;

update public.billing_plan_mappings
set
  provider = lower(provider),
  environment = lower(environment),
  currency_code = upper(currency_code),
  billing_plan_code = lower(billing_plan_code),
  updated_at = now()
where
  provider <> lower(provider)
  or environment <> lower(environment)
  or currency_code <> upper(currency_code)
  or billing_plan_code <> lower(billing_plan_code);

update public.subscriptions s
set
  billing_plan_code = coalesce(s.billing_plan_code, m.billing_plan_code),
  price_id = coalesce(nullif(s.price_id, ''), m.billing_plan_code, s.price_id),
  currency_code = coalesce(s.currency_code, m.currency_code),
  provider_plan_id = coalesce(s.provider_plan_id, m.provider_plan_id),
  updated_at = now()
from public.billing_plan_mappings m
where
  s.provider = m.provider
  and s.environment = m.environment
  and s.provider_plan_id = m.provider_plan_id
  and (
    s.billing_plan_code is null
    or s.currency_code is null
    or s.price_id is null
    or s.price_id = ''
  );

update public.subscriptions
set
  status = 'authenticated',
  external_status_updated_at = coalesce(external_status_updated_at, updated_at, created_at, now()),
  metadata = coalesce(metadata, '{}'::jsonb)
    || jsonb_build_object('schema_repair', 'demoted_active_without_paid_period'),
  updated_at = now()
where
  provider = 'razorpay'
  and status in ('active', 'trialing', 'past_due')
  and current_period_start is null
  and current_period_end is null
  and (
    metadata->>'source' = 'createSubscriptionCheckout'
    or (
      metadata->>'source' = 'verifyRazorpaySubscriptionPayment'
      and metadata->>'razorpay_payment_captured' is distinct from 'true'
    )
    or (
      metadata ? 'razorpay_payment_id'
      and metadata->>'razorpay_payment_captured' is distinct from 'true'
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'billing_plan_mappings_provider_check'
      and conrelid = 'public.billing_plan_mappings'::regclass
  ) then
    alter table public.billing_plan_mappings
      add constraint billing_plan_mappings_provider_check
      check (provider in ('paddle', 'razorpay')) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'billing_plan_mappings_environment_check'
      and conrelid = 'public.billing_plan_mappings'::regclass
  ) then
    alter table public.billing_plan_mappings
      add constraint billing_plan_mappings_environment_check
      check (environment in ('sandbox', 'live')) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'billing_plan_mappings_currency_code_check'
      and conrelid = 'public.billing_plan_mappings'::regclass
  ) then
    alter table public.billing_plan_mappings
      add constraint billing_plan_mappings_currency_code_check
      check (currency_code = upper(currency_code) and currency_code ~ '^[A-Z]{3}$') not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_provider_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_provider_check
      check (provider in ('paddle', 'razorpay')) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_environment_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_environment_check
      check (environment in ('sandbox', 'live')) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_currency_code_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_currency_code_check
      check (currency_code is null or (currency_code = upper(currency_code) and currency_code ~ '^[A-Z]{3}$')) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_provider_identity_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_provider_identity_check
      check (
        provider_subscription_id is not null
        or paddle_subscription_id is not null
      ) not valid;
  end if;
end $$;
