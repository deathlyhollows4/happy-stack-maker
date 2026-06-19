## What I found

**"Page didn't load"** — both the published and preview home (`/`) currently return HTTP 200 with full HTML. No SSR errors in server logs. That message is the branded `renderErrorPage` fallback, which means a specific route SSR-threw, not the whole site. The current route in your preview is `/`, which is healthy.

If you can tell me **which URL** showed the error (e.g. `/dashboard`, `/auth/callback`, `/billing`), I can target that. Otherwise I'll proceed only with security fixes below; if the error reappears after these changes, share the URL and a screenshot of the address bar.

**Security scan — 5 warnings**, all of the same shape: RLS is enabled but no policy is declared, so the intent (server-only vs public) isn't explicit/auditable. The scanner is asking us to mirror the pattern we used for `billing_plan_mappings`.

## Plan

Single migration that adds explicit policies (no behavior change for existing flows):

1. **`app_config`** — server-only. Add `Service role only` `FOR ALL TO service_role USING (true) WITH CHECK (true)`. Revoke anon/authenticated grants, grant `ALL` to `service_role`.
2. **`curriculum_mappings`** — server-only. Same `Service role only` policy + grant cleanup.
3. **`webhook_events`** — server-only (raw payment webhook payloads). Same `Service role only` policy + grant cleanup.
4. **`blog_posts`** — public content. Add `SELECT TO anon, authenticated USING (published = true)`. Add `GRANT SELECT ... TO anon, authenticated`. Service role keeps full access for the admin blog editor.
5. **`usage_counters`** — already has a SELECT-own-rows policy. All writes go through the SECURITY DEFINER `consume_quota` RPC, so no client INSERT/UPDATE policy is needed. Add an explicit comment + a `Service role manages writes` ALL policy `TO service_role` to make intent auditable. No client-side writes will be enabled (those would bypass quota enforcement).

After the migration runs, I'll mark all 5 findings as fixed with explanations and refresh `@security-memory` to record the now-explicit access model.

## Technical notes

- All policies use `TO <role>` explicitly (no defaults).
- Each table keeps RLS enabled. No new client read paths are opened except `blog_posts WHERE published = true`.
- No code changes required — server functions already use `supabaseAdmin` for these tables, and the public blog reader (`src/lib/blog.functions.ts`) already filters on `published = true`.
- No table structure or column changes.
