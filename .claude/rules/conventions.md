# Conventions and Patterns

## File and Import Style
- Route files follow TanStack Router file conventions, including nested folders and `$param` segments.
- Server-side domain logic sits in `src/lib/*.functions.ts`.
- Shared UI lives in `src/components/`, with primitives under `src/components/ui/`.
- Imports use the `@/*` alias for `src/*`.

## Auth Pattern
- Browser route protection uses redirect logic in `src/routes/_authenticated/route.tsx`.
- Server functions that need a user session compose `requireSupabaseAuth`.
- Trusted server-only reads and writes use `supabaseAdmin`.

## Server Function Pattern
- TanStack Start `createServerFn` is the standard backend boundary.
- Inputs are validated with Zod near the function definition.
- Most handlers return plain objects for route components to consume directly.

## Data and Product Patterns
- Review output is validated against Zod schemas before persistence.
- Topic concepts are filtered against a canonical valid-slug set.
- Quotas are environment-aware and enforced through Supabase RPCs.
- Learning progress uses FSRS-style updates in server-side helpers.

## Error Handling
- `src/server.ts` normalizes catastrophic SSR failures into a branded error page.
- `src/start.ts` wraps request handling with error middleware.
- Server functions usually return user-safe error objects for expected failures and log the underlying details.

## Testing Approach
- Unit tests live under `tests/lib/`.
- Playwright covers the critical path under `tests/e2e/`.
- CI runs typecheck, lint, unit tests, and build.

## Content and UX Notes
- Keep copy direct and professional.
- Avoid em dashes in user-facing product text.
- Follow the repo rules in `AGENTS.md` and `CLAUDE.md` for banned phrases and tone.
