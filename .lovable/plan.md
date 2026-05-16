# Fix: Google auth not redirecting to dashboard

## Root cause

Both helpers in `src/lib/auth-helpers.ts` pass `redirect_uri: window.location.origin`, so the broker lands the user back at `/` (the marketing index route). `src/routes/index.tsx` has no auth-aware redirect, so the user just sees the landing page even though the session is set.

The `onGoogleSignIn` / `onGoogleSignUp` handlers DO call `nav({ to: "/dashboard" })`, but only in the non-redirect branch. In the real OAuth flow `result.redirected === true`, the browser navigates away to Google, and after returning the original `LoginPage` component is gone — so that `nav(...)` never runs. The post-return navigation has to happen on whatever page the broker lands on.

We already have a proper post-OAuth page: `src/routes/auth/callback.tsx`. It waits for `getSession()` / `onAuthStateChange` and then `nav({ to: "/dashboard" })`. We just aren't pointing the broker at it.

## Change

Edit `src/lib/auth-helpers.ts` only — point both helpers at the callback route:

```ts
const redirect_uri = `${window.location.origin}/auth/callback`;

export function signInWithGoogle() {
  return lovable.auth.signInWithOAuth("google", { redirect_uri });
}

export function signInWithGoogleSignUp() {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri,
    extraParams: { prompt: "select_account" },
  });
}
```

That's it. The existing `/auth/callback` component handles both first-time and returning users identically — it just reads the session and pushes to `/dashboard`. So "first-time users land on dashboard" is satisfied automatically; there is no separate onboarding gate in the current code.

## Not changing

- `src/routes/auth/callback.tsx` — already correct.
- `src/routes/login.tsx` / `src/routes/signup.tsx` — the post-call `nav(...)` is dead code in the redirect path but harmless; leaving it avoids churn.
- `src/routes/index.tsx` — no auth gate needed; the broker no longer lands here.
- No Supabase config, no new routes, no DB work.

## Verify

1. `/login` → Google → consent → returns to `/auth/callback` → spinner → `/dashboard`.
2. `/signup` → Google (account picker due to `prompt=select_account`) → returns to `/auth/callback` → `/dashboard`.
3. Auth logs: no `missing OAuth secret`; callback URL in the broker request now ends with `/auth/callback`.
