-- Add code_run to usage_counters allowed kinds
alter table public.usage_counters drop constraint if exists usage_counters_kind_check;
alter table public.usage_counters add constraint usage_counters_kind_check
  check (kind in ('review', 'roadmap', 'code_run'));
