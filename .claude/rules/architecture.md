# Architecture

## Folder Map
- `src/components/` - shared UI, editor, analytics, onboarding, navigation
- `src/hooks/` - auth, billing, telemetry, theme, mobile helpers
- `src/integrations/supabase/` - browser and server Supabase clients, auth middleware, generated DB types
- `src/lib/` - server functions and domain logic for review, dashboard, billing, admin, blog, consent, practice
- `src/routes/` - TanStack Router file-based pages and API-like route handlers
- `src/server.ts` - server entry wrapper, branded 500 page, security headers, CSP
- `src/start.ts` - TanStack Start bootstrap, error middleware, Supabase auth middleware
- `supabase/migrations/` - schema, RLS, quotas, subscriptions, blog, consent, research, webhook events
- `scripts/` - evaluation and maintenance scripts
- `tests/` - Vitest unit tests and Playwright critical-path coverage

## Entry Points
- `src/start.ts` creates the TanStack Start instance.
- `src/router.tsx` creates the router from `src/routeTree.gen.ts`.
- `src/server.ts` wraps the SSR/server entry and injects security headers on every response.
- `src/routes/__root.tsx` defines the root layout.
- `src/routes/_authenticated/route.tsx` gates the authenticated app shell.

## Request Flow
1. A request enters through `src/server.ts`.
2. The server wrapper normalizes catastrophic SSR failures and adds security headers plus CSP.
3. `src/start.ts` runs request middleware and function middleware.
4. TanStack Router resolves the route from `src/routes/`.
5. Route components call server functions from `src/lib/` through TanStack Start.
6. Authenticated server functions use Supabase middleware and read or write PostgreSQL data.

## Core Product Flows

### Code review flow
1. The authenticated review page posts code and language to `reviewCode`.
2. `reviewCode` checks the user plan and quota through `entitlements.server.ts`.
3. The server function calls the Lovable AI Gateway with `openai/gpt-5-mini`.
4. Parsed issues and summaries are stored in `submissions` and `review_issues`.
5. FSRS progress is updated per concept and shown later on the dashboard.

### Authenticated app flow
1. `src/routes/_authenticated/route.tsx` redirects unauthenticated users to `/login`.
2. Server functions that require auth use `requireSupabaseAuth`.
3. The middleware rebuilds a Supabase client from the bearer token and injects `userId` into function context.

### Billing flow
1. Client UI uses Paddle helpers and billing hooks.
2. Server billing functions read subscriptions and plan quotas.
3. `/api/public/payments/webhook` updates subscription state from Paddle events.

## External Dependencies
- Supabase: auth, Postgres, RLS, storage
- Lovable AI Gateway: review and practice generation
- Paddle: checkout, subscriptions, webhook sync
- Cloudflare Workers via TanStack Start server deployment

## Environment Surface
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `LOVABLE_API_KEY`
- `PADDLE_SANDBOX_API_KEY`
- `PADDLE_LIVE_API_KEY`
- `PAYMENTS_SANDBOX_WEBHOOK_SECRET`
- `PAYMENTS_LIVE_WEBHOOK_SECRET`
- `VITE_PAYMENTS_CLIENT_TOKEN`
