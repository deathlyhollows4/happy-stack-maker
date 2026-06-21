alter table public.practice_problems
  add column if not exists contract_version text,
  add column if not exists curriculum_node_id text,
  add column if not exists mastery_band text,
  add column if not exists objective text,
  add column if not exists statement text,
  add column if not exists topic_tags jsonb not null default '[]'::jsonb,
  add column if not exists prerequisite_tags jsonb not null default '[]'::jsonb,
  add column if not exists examples jsonb not null default '[]'::jsonb,
  add column if not exists constraints jsonb not null default '[]'::jsonb,
  add column if not exists function_signature jsonb,
  add column if not exists visible_tests jsonb not null default '[]'::jsonb,
  add column if not exists hidden_test_themes jsonb not null default '[]'::jsonb,
  add column if not exists hint_ladder jsonb not null default '[]'::jsonb,
  add column if not exists success_criteria jsonb not null default '[]'::jsonb,
  add column if not exists generation_status text not null default 'legacy';

alter table public.practice_problems
  drop constraint if exists practice_problems_mastery_band_check,
  add constraint practice_problems_mastery_band_check
    check (
      mastery_band is null
      or mastery_band in ('0-20', '21-40', '41-60', '61-80', '81-100')
    );

alter table public.practice_problems
  drop constraint if exists practice_problems_generation_status_check,
  add constraint practice_problems_generation_status_check
    check (generation_status in ('legacy', 'structured', 'failed'));

alter table public.practice_problems
  drop constraint if exists practice_problems_structured_json_arrays_check,
  add constraint practice_problems_structured_json_arrays_check
    check (
      jsonb_typeof(topic_tags) = 'array'
      and jsonb_typeof(prerequisite_tags) = 'array'
      and jsonb_typeof(examples) = 'array'
      and jsonb_typeof(constraints) = 'array'
      and jsonb_typeof(visible_tests) = 'array'
      and jsonb_typeof(hidden_test_themes) = 'array'
      and jsonb_typeof(hint_ladder) = 'array'
      and jsonb_typeof(success_criteria) = 'array'
    );

create index if not exists practice_problems_curriculum_node_idx
  on public.practice_problems (user_id, curriculum_node_id, created_at desc);

create index if not exists practice_problems_mastery_band_idx
  on public.practice_problems (user_id, mastery_band, created_at desc);

create table if not exists public.practice_problem_hidden_tests (
  id uuid primary key default gen_random_uuid(),
  practice_problem_id uuid not null references public.practice_problems(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hidden_tests jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint practice_problem_hidden_tests_json_array_check
    check (jsonb_typeof(hidden_tests) = 'array'),
  constraint practice_problem_hidden_tests_problem_unique
    unique (practice_problem_id)
);

alter table public.practice_problem_hidden_tests enable row level security;

revoke all on public.practice_problem_hidden_tests from anon, authenticated;
grant all on public.practice_problem_hidden_tests to service_role;

drop policy if exists "Service role manages hidden practice tests"
  on public.practice_problem_hidden_tests;
create policy "Service role manages hidden practice tests"
  on public.practice_problem_hidden_tests
  for all to service_role
  using (true)
  with check (true);

create index if not exists practice_problem_hidden_tests_user_idx
  on public.practice_problem_hidden_tests (user_id, created_at desc);

create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_problem_id uuid not null references public.practice_problems(id) on delete cascade,
  language text not null,
  code text,
  status text not null default 'started',
  visible_tests_passed integer not null default 0,
  visible_tests_total integer not null default 0,
  hidden_tests_passed integer,
  hidden_tests_total integer,
  correctness_score real not null default 0,
  hint_count integer not null default 0,
  review_quality_score real,
  speed_seconds integer,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint practice_attempts_status_check
    check (status in ('started', 'visible_run', 'submitted', 'completed', 'failed')),
  constraint practice_attempts_non_negative_counts_check
    check (
      visible_tests_passed >= 0
      and visible_tests_total >= 0
      and (hidden_tests_passed is null or hidden_tests_passed >= 0)
      and (hidden_tests_total is null or hidden_tests_total >= 0)
      and hint_count >= 0
      and (speed_seconds is null or speed_seconds >= 0)
    ),
  constraint practice_attempts_score_range_check
    check (
      correctness_score >= 0
      and correctness_score <= 1
      and (review_quality_score is null or (review_quality_score >= 0 and review_quality_score <= 1))
    )
);

alter table public.practice_attempts enable row level security;

grant select, insert, update, delete on public.practice_attempts to authenticated;
grant all on public.practice_attempts to service_role;

drop policy if exists "Users manage own practice attempts" on public.practice_attempts;
create policy "Users manage own practice attempts"
  on public.practice_attempts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role manages practice attempts" on public.practice_attempts;
create policy "Service role manages practice attempts"
  on public.practice_attempts
  for all to service_role
  using (true)
  with check (true);

create index if not exists practice_attempts_user_created_idx
  on public.practice_attempts (user_id, created_at desc);

create index if not exists practice_attempts_problem_created_idx
  on public.practice_attempts (practice_problem_id, created_at desc);

create table if not exists public.practice_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practice_problem_id uuid references public.practice_problems(id) on delete cascade,
  practice_attempt_id uuid references public.practice_attempts(id) on delete set null,
  event_type text not null,
  topic_slug text references public.topics(slug) on delete set null,
  curriculum_node_id text,
  mastery_band text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint practice_events_mastery_band_check
    check (
      mastery_band is null
      or mastery_band in ('0-20', '21-40', '41-60', '61-80', '81-100')
    ),
  constraint practice_events_payload_object_check
    check (jsonb_typeof(payload) = 'object')
);

alter table public.practice_events enable row level security;

grant select, insert, update, delete on public.practice_events to authenticated;
grant all on public.practice_events to service_role;

drop policy if exists "Users manage own practice events" on public.practice_events;
create policy "Users manage own practice events"
  on public.practice_events
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Service role manages practice events" on public.practice_events;
create policy "Service role manages practice events"
  on public.practice_events
  for all to service_role
  using (true)
  with check (true);

create index if not exists practice_events_user_created_idx
  on public.practice_events (user_id, created_at desc);

create index if not exists practice_events_problem_created_idx
  on public.practice_events (practice_problem_id, created_at desc);

create index if not exists practice_events_type_created_idx
  on public.practice_events (event_type, created_at desc);

grant select, insert, update, delete on public.practice_problems to authenticated;
grant all on public.practice_problems to service_role;
