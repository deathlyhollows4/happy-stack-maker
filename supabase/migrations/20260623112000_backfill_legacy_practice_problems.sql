-- Mark old markdown-only practice problems explicitly as legacy without treating
-- their markdown prompt as a structured v1 problem.

update public.practice_problems
set generation_status = 'structured'
where contract_version in ('codewise-dsa-problem.v1', 'practice-problem.v1')
  and generation_status is distinct from 'structured';

update public.practice_problems
set
  generation_status = 'legacy',
  planning_context = coalesce(planning_context, '{}'::jsonb)
    || jsonb_build_object(
      'legacyBackfill',
      jsonb_build_object(
        'version', 'legacy-practice-problem.v1',
        'source', 'markdown-only-practice-problems',
        'renderMode', 'markdown',
        'backfilledAt', '2026-06-23T00:00:00Z'
      )
    )
where contract_version is null
  and generation_status is distinct from 'structured'
  and nullif(btrim(coalesce(statement, '')), '') is null
  and function_signature is null
  and coalesce(visible_tests, '[]'::jsonb) = '[]'::jsonb
  and nullif(btrim(prompt), '') is not null
  and not (coalesce(planning_context, '{}'::jsonb) ? 'legacyBackfill');
