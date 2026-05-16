## Problem

After signing in, the dashboard renders for ~1–2 seconds then bounces back to `/login`. This is an SSR/hydration race, not a credential issue (auth logs show successful login).

Root cause: `src/routes/_authenticated/route.tsx` runs its session check in `beforeLoad` using `supabase.auth.getSession()`. That call also executes during server-side rendering and during the live-preview reload (the `__lovable_sha=...` reload visible in the session replay right before the bounce). On the server there is no `localStorage`, so `getSession()` returns `null` and `beforeLoad` throws `redirect({ to: "/login" })`. The browser briefly shows the client-rendered dashboard, then the SSR/reload result wins and the URL flips to `/login`.

## Fix

Make the auth gate client-only and wait for the Supabase session to actually hydrate before deciding.

### `src/routes/_authenticated/route.tsx`
- In `beforeLoad`, short-circuit when running on the server (`if (typeof window === "undefined") return;`). The component-level gate handles the real check on the client.
- In the `AuthLayout` component, replace the bare `if (!user) return null;` with a proper redirect once `loading` is false and `user` is still null — use `useEffect` + `nav({ to: "/login" })` so it only fires after the Supabase session has had a chance to restore from `localStorage`. While `loading` is true, keep showing the existing "Loading…" state.

### `src/routes/__root.tsx` (small hardening)
- Inside `RootComponent`, add a single `useEffect` that subscribes to `supabase.auth.onAuthStateChange` and calls `router.invalidate()` + `queryClient.invalidateQueries()` on every event. This prevents the previous user's cached dashboard data from sticking around after sign-in/out and is the pattern recommended for TanStack + Supabase.

No other files need to change. Login/signup flow, server functions, and the dashboard query stay as-is.

## Why this works

- The dashboard never renders on the server for unauthenticated requests (component gate still runs), but `beforeLoad` no longer issues a spurious server-side redirect that overwrites the client.
- On the client, `useAuth` already calls `getSession()` once and then listens to `onAuthStateChange`, so the redirect only fires after Supabase has finished restoring the session — eliminating the flash-then-bounce.
- The root-level `onAuthStateChange` ensures the just-signed-in user immediately sees their own data instead of any stale loader result.

## Out of scope

- No design, font, copy, or styling changes.
- No changes to server functions or the dashboard query itself.
- No changes to `_authenticated` children (`dashboard.tsx`, `review.tsx`, `practice.tsx`).
