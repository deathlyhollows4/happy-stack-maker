# Fix Google sign-in hang on /auth/callback

## Problem

New users signing up with Google land on `/auth/callback` and the page sits on "Completing sign in…" until it errors out with a generic "something went wrong" toast.

Existing users sometimes work because they already have a Supabase session in `localStorage`, so `supabase.auth.getSession()` resolves immediately and the page navigates to `/dashboard`. New users have no prior session, so the page waits for `onAuthStateChange` to fire and nothing ever fires it.

## Root cause

`src/lib/auth-helpers.ts` sets `redirect_uri = ${origin}/auth/callback`. The Lovable OAuth broker returns to that URL with tokens, but the broker tokens are only consumed when the `lovable.auth.signInWithOAuth(...)` SDK call is invoked on the returning page. `src/routes/auth/callback.tsx` only reads `supabase.auth.getSession()` and subscribes to `onAuthStateChange` — it never invokes the Lovable SDK, so the tokens in the URL are never exchanged into a Supabase session. For first-time accounts, this means the session never materialises and the page hangs.

## Fix

Make `/auth/callback` actually consume the OAuth response by calling the Lovable SDK on mount, then navigate based on the result.

1. `src/routes/auth/callback.tsx`
   - On mount, call `lovable.auth.signInWithOAuth("google", { redirect_uri: ${origin}/auth/callback })`. When the SDK is invoked on a return URL containing tokens, it consumes them and calls `supabase.auth.setSession`.
   - On `result.error`, surface the message in the existing error state.
   - On success (session present), `navigate({ to: "/dashboard" })`.
   - Keep a short fallback: if after the SDK call there is still no session, fall back to checking `supabase.auth.getSession()` once, then show the error UI.
   - Remove the long-lived `onAuthStateChange` subscription — it's the source of the indefinite spinner.

2. No other files need to change. `signInWithGoogle` / `signInWithGoogleSignUp` and the broker config stay the same; the redirect URL contract (`/auth/callback`) is preserved.

## Verification

- Sign in with a brand-new Google account → should land on `/dashboard` within ~1s instead of hanging.
- Existing Google user → still lands on `/dashboard`.
- Cancel the Google consent screen → returns to `/auth/callback` with an error param; the error state renders with a "Back to sign in" link.
- Check the dev-server log and browser console for any SDK errors after the change.
