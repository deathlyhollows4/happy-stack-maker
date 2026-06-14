# Fix infinite reload on `/auth/callback` after Google sign-up

## Root cause

`src/routes/auth/callback.tsx` currently calls `lovable.auth.signInWithOAuth("google", { redirect_uri: ".../auth/callback" })` on mount. Inspecting `@lovable.dev/cloud-auth-js` (`node_modules/.../dist/index.js`) shows that on a top-level (non-iframe) page this call unconditionally does:

```
window.location.href = `${oauthBrokerUrl}?...`;
return { redirected: true };
```

It does NOT detect that we're already on a return URL with tokens. So on the published site the flow becomes:

1. User completes Google consent → broker redirects to `/auth/callback#access_token=...&refresh_token=...`
2. Callback page mounts → calls `signInWithOAuth` → redirects to `/~oauth/initiate` again
3. Broker bounces back to `/auth/callback` with new tokens → loop

That's the "stuck on Completing sign in… and keeps reloading" symptom. It also explains why existing users sometimes worked (a prior valid session may have already been written to `localStorage` before the loop started).

The popup/iframe flow (used in the editor preview) does work, because the SDK's `setSession(result.tokens)` is called inside the popup wrapper in `src/integrations/lovable/index.ts`, and the opener page handles navigation. The break is specifically the top-level redirect flow on the published site.

## Fix

Make `/auth/callback` consume the tokens the broker put in the URL, instead of re-initiating OAuth.

### `src/routes/auth/callback.tsx`

On mount:

1. Read tokens from `window.location.hash` (and fall back to `window.location.search` in case the broker uses query params). Expected params: `access_token`, `refresh_token`, optional `error` / `error_description`.
2. If `error` is present → set error state, render the existing failure UI with the "Back to sign in" link.
3. If both tokens are present → `await supabase.auth.setSession({ access_token, refresh_token })`. On success, clear the hash with `history.replaceState(null, "", window.location.pathname)` and `navigate({ to: "/dashboard", replace: true })`.
4. If neither tokens nor error are present (someone landed on the page directly), fall back once to `supabase.auth.getSession()`. If a session exists → navigate to `/dashboard`; otherwise show the error UI.
5. Do NOT call `lovable.auth.signInWithOAuth` here. Remove that import.
6. Keep the `cancelled` flag for unmount safety. No `onAuthStateChange` subscription.

No other files change. `signInWithGoogle` / `signInWithGoogleSignUp` and the broker config stay the same; `redirect_uri` remains `/auth/callback`.

## Verification

- Brand-new Google account on the published site → lands on `/dashboard` within ~1s, URL hash cleared, no reload loop.
- Existing Google user → still lands on `/dashboard`.
- Cancel Google consent → `/auth/callback?error=...`, error UI renders with "Back to sign in".
- Visit `/auth/callback` directly with no params and no session → error UI renders, no redirect loop.
- Editor preview (iframe popup flow) → unchanged: `signup.tsx` / `login.tsx` still navigate to `/dashboard` after the popup resolves.
