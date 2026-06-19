ALTER TABLE public.billing_plan_mappings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_plan_mappings FROM anon, authenticated;
GRANT ALL ON public.billing_plan_mappings TO service_role;
CREATE POLICY "Service role only" ON public.billing_plan_mappings FOR ALL TO service_role USING (true) WITH CHECK (true);