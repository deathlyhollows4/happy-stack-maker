create table if not exists public.billing_plan_mappings (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  environment text not null default 'sandbox',
  currency_code text not null,
  billing_plan_code text not null,
  provider_plan_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_plan_mappings_provider_env_currency_code_key
  on public.billing_plan_mappings(provider, environment, currency_code, billing_plan_code);

create unique index if not exists billing_plan_mappings_provider_env_plan_id_key
  on public.billing_plan_mappings(provider, environment, provider_plan_id);

alter table public.subscriptions
  add column if not exists provider text not null default 'paddle',
  add column if not exists provider_subscription_id text,
  add column if not exists provider_customer_id text,
  add column if not exists provider_plan_id text,
  add column if not exists billing_plan_code text,
  add column if not exists currency_code text,
  add column if not exists external_status_updated_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.subscriptions
  alter column paddle_subscription_id drop not null,
  alter column paddle_customer_id drop not null;

update public.subscriptions
set
  provider = coalesce(provider, 'paddle'),
  provider_subscription_id = coalesce(provider_subscription_id, paddle_subscription_id),
  provider_customer_id = coalesce(provider_customer_id, paddle_customer_id),
  provider_plan_id = coalesce(provider_plan_id, price_id),
  billing_plan_code = coalesce(billing_plan_code, price_id),
  external_status_updated_at = coalesce(external_status_updated_at, updated_at, created_at),
  metadata = coalesce(metadata, '{}'::jsonb);

create unique index if not exists subscriptions_provider_subscription_key
  on public.subscriptions(provider, environment, provider_subscription_id)
  where provider_subscription_id is not null;

create index if not exists idx_subscriptions_provider_user_env
  on public.subscriptions(user_id, environment, provider, created_at desc);

create index if not exists idx_subscriptions_external_status_updated_at
  on public.subscriptions(external_status_updated_at desc);

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

insert into public.app_config (key, value)
values ('plan_quota_pro_problems', '150')
on conflict (key) do update
set
  value = excluded.value,
  updated_at = now();
