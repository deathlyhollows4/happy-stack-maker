-- Usage counters for entitlement enforcement
create table public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('review','roadmap')),
  period_key text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, period_key)
);

alter table public.usage_counters enable row level security;

create policy "Users can read own usage"
  on public.usage_counters for select
  using (auth.uid() = user_id);

-- Atomic increment-with-limit. Returns true on success, false if at/over limit.
create or replace function public.consume_quota(
  p_user_id uuid,
  p_kind text,
  p_limit integer,
  p_period_key text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.usage_counters (user_id, kind, period_key, count)
  values (p_user_id, p_kind, p_period_key, 0)
  on conflict (user_id, kind, period_key) do nothing;

  update public.usage_counters
    set count = count + 1, updated_at = now()
    where user_id = p_user_id
      and kind = p_kind
      and period_key = p_period_key
      and count < p_limit
    returning count into v_count;

  return v_count is not null;
end;
$$;

-- Read current usage without incrementing (for UI display)
create or replace function public.get_usage(
  p_user_id uuid,
  p_kind text,
  p_period_key text
) returns integer
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select count from public.usage_counters
      where user_id = p_user_id and kind = p_kind and period_key = p_period_key),
    0
  );
$$;