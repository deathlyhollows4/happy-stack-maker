
-- 1. app_config: server-only
REVOKE ALL ON public.app_config FROM anon, authenticated;
GRANT ALL ON public.app_config TO service_role;
DROP POLICY IF EXISTS "Service role only" ON public.app_config;
CREATE POLICY "Service role only" ON public.app_config
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. curriculum_mappings: server-only
REVOKE ALL ON public.curriculum_mappings FROM anon, authenticated;
GRANT ALL ON public.curriculum_mappings TO service_role;
DROP POLICY IF EXISTS "Service role only" ON public.curriculum_mappings;
CREATE POLICY "Service role only" ON public.curriculum_mappings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. webhook_events: server-only (raw payment webhook payloads)
REVOKE ALL ON public.webhook_events FROM anon, authenticated;
GRANT ALL ON public.webhook_events TO service_role;
DROP POLICY IF EXISTS "Service role only" ON public.webhook_events;
CREATE POLICY "Service role only" ON public.webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. blog_posts: public read of published posts; service role full access
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
DROP POLICY IF EXISTS "Public can read published posts" ON public.blog_posts;
CREATE POLICY "Public can read published posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated USING (published = true);
DROP POLICY IF EXISTS "Service role manages blog posts" ON public.blog_posts;
CREATE POLICY "Service role manages blog posts" ON public.blog_posts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. usage_counters: writes go through SECURITY DEFINER consume_quota RPC;
-- make service-role write intent explicit. Existing SELECT-own policy stays.
GRANT ALL ON public.usage_counters TO service_role;
DROP POLICY IF EXISTS "Service role manages writes" ON public.usage_counters;
CREATE POLICY "Service role manages writes" ON public.usage_counters
  FOR ALL TO service_role USING (true) WITH CHECK (true);
COMMENT ON TABLE public.usage_counters IS
  'Quota counters. Client writes are intentionally not allowed via RLS; all increments go through the SECURITY DEFINER public.consume_quota RPC.';
