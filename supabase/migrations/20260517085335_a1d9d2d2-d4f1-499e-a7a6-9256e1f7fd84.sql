-- user_roles table for admin / college license role management
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Only admins can read roles; users can read their own
create policy "Admins can read all roles"
  on public.user_roles for select
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ));

create policy "Users can read own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Only admins can insert/delete roles
create policy "Admins can insert roles"
  on public.user_roles for insert
  with check (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ));

create policy "Admins can delete roles"
  on public.user_roles for delete
  using (exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'admin'
  ));

-- Security definer helper: returns true if the given user has the given role
create or replace function public.has_role(
  p_user_id uuid,
  p_role text
) returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role = p_role
  );
$$;

revoke execute on function public.has_role(uuid, text) from public, anon;
grant execute on function public.has_role(uuid, text) to authenticated, service_role;
