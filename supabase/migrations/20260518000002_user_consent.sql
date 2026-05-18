-- User consent tracking for research data collection (ICNDIA-2027 paper)
-- Users opt in to anonymized telemetry collection. Opt-out by default.
create table public.user_consent (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consent_given boolean not null default false,
  consented_at timestamptz not null default now(),
  consent_version text not null default '1.0'
);

alter table public.user_consent enable row level security;

-- Users can read their own consent status
create policy "Users can read own consent" on public.user_consent
  for select using (auth.uid() = user_id);

-- No insert/update/delete policies -- writes go through supabaseAdmin in server functions
