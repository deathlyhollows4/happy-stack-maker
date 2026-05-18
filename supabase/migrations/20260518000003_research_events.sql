-- Anonymized research telemetry events for ICNDIA-2027 paper
-- Events are only recorded for users who have given consent.
-- Insert via supabaseAdmin in server functions; no direct user insert.
create table public.research_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_research_events_user_id on public.research_events(user_id);
create index idx_research_events_type on public.research_events(event_type);
create index idx_research_events_created_at on public.research_events(created_at);

alter table public.research_events enable row level security;

-- No direct user access policies -- all access via supabaseAdmin
