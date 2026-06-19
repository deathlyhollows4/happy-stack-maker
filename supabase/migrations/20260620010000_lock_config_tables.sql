alter table public.app_config enable row level security;
alter table public.billing_plan_mappings enable row level security;

revoke all on public.app_config from anon, authenticated;
revoke all on public.billing_plan_mappings from anon, authenticated;

grant all on public.app_config to service_role;
grant all on public.billing_plan_mappings to service_role;
