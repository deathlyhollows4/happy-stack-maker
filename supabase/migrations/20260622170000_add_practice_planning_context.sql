alter table public.practice_problems
  add column if not exists planning_context jsonb not null default '{}'::jsonb;

alter table public.practice_problems
  drop constraint if exists practice_problems_planning_context_object_check,
  add constraint practice_problems_planning_context_object_check
    check (jsonb_typeof(planning_context) = 'object');
