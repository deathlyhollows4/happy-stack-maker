# Gotchas and Workarounds

## Important Repo Rules
- `CLAUDE.md` is repo-specific and must keep the GitNexus guidance intact.
- Generated memory files are supplemental context, not the source of truth.
- Before editing code symbols, follow the GitNexus impact-analysis rules from `CLAUDE.md` or `AGENTS.md`.

## Memory Limitations
- The first `codebase-memory analyze .` pass missed real routes, models, and some folder contents.
- Treat generated memory as draft context that can help orient you, then verify against code or GitNexus before important edits.

## Package Manager Mismatch
- CI is npm-based.
- The repo also contains `bun.lock`.
- Prefer the commands documented by the repo or CI when there is ambiguity.

## Auth and Env Risks
- Authenticated server functions require bearer-token context through Supabase middleware.
- Missing Supabase env vars fail fast in `auth-middleware.ts`.
- Missing `LOVABLE_API_KEY` disables AI review and practice generation.

## Billing Risks
- Billing logic is environment-aware and uses both sandbox and live Paddle credentials.
- Webhook handling and entitlement checks depend on matching the correct environment.

## Do Not Touch Without Intent
- `src/routeTree.gen.ts` is generated output.
- `src/integrations/supabase/types.ts` is generated typing.
- Migration history under `supabase/migrations/` should be changed intentionally, not casually rewritten.
- Lockfiles should follow the package manager strategy chosen for the repo.
