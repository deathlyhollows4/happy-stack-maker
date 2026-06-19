create table if not exists public.webhook_events (
  id bigserial primary key,
  event_id text not null,
  event_type text not null,
  created_at timestamptz not null default now()
);

alter table public.webhook_events
  add column if not exists provider text not null default 'paddle',
  add column if not exists environment text,
  add column if not exists raw_payload text,
  add column if not exists processed_at timestamptz,
  add column if not exists processing_error text;

alter table public.webhook_events
  drop constraint if exists webhook_events_event_id_key;

drop index if exists idx_webhook_events_event_id;

create unique index if not exists webhook_events_provider_event_id_key
  on public.webhook_events(provider, event_id);

create index if not exists idx_webhook_events_provider_env_created_at
  on public.webhook_events(provider, environment, created_at desc);

with captured_order_events as (
  select
    we.event_id,
    we.event_type,
    we.environment,
    we.created_at as webhook_created_at,
    we.raw_payload::jsonb as payload
  from public.webhook_events we
  where we.provider = 'razorpay'
    and we.raw_payload is not null
    and we.raw_payload like '{%'
    and we.event_type in ('payment.captured', 'order.paid')
),
event_facts as (
  select
    event_id,
    event_type,
    environment,
    coalesce(
      nullif(payload #>> '{payload,payment,entity,order_id}', ''),
      nullif(payload #>> '{payload,order,entity,id}', '')
    ) as order_id,
    nullif(payload #>> '{payload,payment,entity,id}', '') as payment_id,
    coalesce(
      nullif(payload #>> '{payload,payment,entity,currency}', ''),
      nullif(payload #>> '{payload,order,entity,currency}', '')
    ) as currency_code,
    coalesce(
      nullif(payload #>> '{payload,payment,entity,amount}', '')::integer,
      nullif(payload #>> '{payload,order,entity,amount_paid}', '')::integer,
      nullif(payload #>> '{payload,order,entity,amount}', '')::integer
    ) as paid_amount,
    case
      when nullif(payload->>'created_at', '') is not null
        then to_timestamp((payload->>'created_at')::numeric)
      else webhook_created_at
    end as occurred_at,
    (
      event_type = 'order.paid'
      or payload #>> '{payload,payment,entity,captured}' = 'true'
      or payload #>> '{payload,payment,entity,status}' = 'captured'
    ) as payment_captured
  from captured_order_events
),
eligible as (
  select
    s.id,
    ef.event_id,
    ef.event_type,
    ef.order_id,
    ef.payment_id,
    ef.paid_amount,
    ef.payment_captured,
    ef.occurred_at,
    upper(coalesce(ef.currency_code, s.currency_code, 'INR')) as currency_code,
    s.billing_plan_code,
    (s.metadata->>'razorpay_order_amount')::integer as recorded_order_amount,
    case s.billing_plan_code
      when 'pro_monthly' then (
        select (value::integer * 100)
        from public.app_config
        where key = 'plan_price_pro_monthly'
      )
      when 'pro_yearly' then (
        select (value::integer * 100)
        from public.app_config
        where key = 'plan_price_pro_yearly'
      )
      else null
    end as expected_amount
  from event_facts ef
  join public.subscriptions s
    on s.provider = 'razorpay'
   and s.environment = ef.environment
   and s.provider_subscription_id = ef.order_id
  where ef.order_id is not null
)
update public.subscriptions s
set
  status = 'active',
  current_period_start = coalesce(
    case
      when s.status in ('active', 'trialing', 'past_due')
       and (s.current_period_end is null or s.current_period_end > now())
        then s.current_period_start
      else null
    end,
    eligible.occurred_at
  ),
  current_period_end = case
    when s.status in ('active', 'trialing', 'past_due')
     and s.current_period_end is not null
     and s.current_period_end > now()
      then s.current_period_end
    when eligible.billing_plan_code = 'pro_yearly'
      then eligible.occurred_at + interval '1 year'
    else eligible.occurred_at + interval '1 month'
  end,
  cancel_at_period_end = false,
  currency_code = eligible.currency_code,
  external_status_updated_at = greatest(
    coalesce(s.external_status_updated_at, '-infinity'::timestamptz),
    eligible.occurred_at
  ),
  metadata = coalesce(s.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'source', 'razorpay_webhook_backfill',
      'checkout_mode', 'order',
      'last_razorpay_event', eligible.event_type,
      'last_razorpay_event_id', eligible.event_id,
      'razorpay_order_id', eligible.order_id,
      'razorpay_payment_id', eligible.payment_id,
      'razorpay_payment_amount', eligible.paid_amount,
      'razorpay_payment_captured', eligible.payment_captured,
      'expected_amount', eligible.expected_amount,
      'amount_matches', true,
      'currency_matches', true
    ),
  updated_at = now()
from eligible
where s.id = eligible.id
  and eligible.payment_captured = true
  and eligible.paid_amount is not null
  and eligible.currency_code = 'INR'
  and (
    eligible.paid_amount = eligible.expected_amount
    or eligible.paid_amount = eligible.recorded_order_amount
  );