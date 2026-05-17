-- Admin-manageable configuration key-value store
create table public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

create policy "Admins can read config"
  on public.app_config for select
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ));

create policy "Admins can upsert config"
  on public.app_config for insert
  with check (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ));

create policy "Admins can update config"
  on public.app_config for update
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ));

-- Seed default values matching current pricing/entitlements
insert into public.app_config (key, value) values
  ('plan_quota_free_reviews', '50'),
  ('plan_quota_free_problems', '25'),
  ('plan_quota_free_code_runs', '100'),
  ('plan_quota_pro_reviews', '1500'),
  ('plan_quota_pro_problems', '15'),
  ('plan_quota_pro_code_runs', '100'),
  ('plan_price_pro_monthly', '20'),
  ('plan_price_pro_yearly', '199')
on conflict (key) do nothing;
