# Project Conventions | CodeWise

Read `CLAUDE.md` and `.claude/rules/` first.

Core conventions:
- TanStack Router file conventions define page structure in `src/routes/`.
- Server boundaries live in `src/lib/*.functions.ts`.
- Inputs are usually validated with Zod.
- Shared imports use the `@/*` alias to `src/*`.
- Authenticated server functions use Supabase auth middleware.

Operational notes:
- CI uses npm commands even though the repo also contains `bun.lock`.
- Generated memory is helper context, not a substitute for verification.
- `src/routeTree.gen.ts` and `src/integrations/supabase/types.ts` are generated outputs.
