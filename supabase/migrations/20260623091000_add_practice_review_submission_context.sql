alter table public.submissions
  add column if not exists practice_problem_id uuid references public.practice_problems(id) on delete set null,
  add column if not exists practice_attempt_id uuid references public.practice_attempts(id) on delete set null,
  add column if not exists practice_metadata jsonb not null default '{}'::jsonb;

alter table public.submissions
  drop constraint if exists submissions_practice_metadata_object_check,
  add constraint submissions_practice_metadata_object_check
    check (jsonb_typeof(practice_metadata) = 'object');

create index if not exists submissions_practice_attempt_idx
  on public.submissions (practice_attempt_id)
  where practice_attempt_id is not null;

create index if not exists submissions_practice_problem_idx
  on public.submissions (practice_problem_id, created_at desc)
  where practice_problem_id is not null;
