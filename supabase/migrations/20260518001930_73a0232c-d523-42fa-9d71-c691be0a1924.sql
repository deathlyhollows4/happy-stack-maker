CREATE TABLE IF NOT EXISTS public.curriculum_mappings (
  topic_slug text PRIMARY KEY,
  sppu_course text,
  sppu_module text,
  nptel_course text,
  nptel_module text,
  year_semester text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.curriculum_mappings ENABLE ROW LEVEL SECURITY;
-- No policies: only the backend (service role) accesses this table.
