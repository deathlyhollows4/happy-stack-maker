ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies are added: only the service role (used by the webhook handler)
-- can access this table. All other roles are denied by default.
REVOKE ALL ON public.webhook_events FROM anon, authenticated;
GRANT ALL ON public.webhook_events TO service_role;