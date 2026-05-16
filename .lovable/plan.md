# Fix Google OAuth — switch to Lovable-managed broker

## Root cause

The login/signup pages call `supabase.auth.signInWithOAuth({ provider: "google", ... })` directly. That hits Supabase's `/authorize` endpoint, which has **no Google client_id/secret configured** on this project — hence `400 Unsupported provider: missing OAuth secret` in the auth logs.

Lovable Cloud's managed Google credentials are **only** wired up through the broker package we already installed: `@lovable.dev/cloud-auth-js`, exposed at `src/integrations/lovable/index.ts` as `lovable.auth.signInWithOAuth(...)`. That call goes through Lovable's OAuth proxy (`/~oauth/...`) using managed client credentials, then sets the Supabase session for us.

So the fix is a code migration, not a secret/config change. No Google Cloud Console setup, no BYOK.

## Changes

### 1. `src/lib/auth-helpers.ts`
Replace both helpers to use the broker:

```ts
import { lovable } from "@/integrations/lovable";

export function signInWithGoogle() {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
}

export function signInWithGoogleSignUp() {
  return lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
    extraParams: { prompt: "select_account" },
  });
}
```

### 2. `src/routes/login.tsx` and `src/routes/signup.tsx`
Handlers already call the helpers, but the broker returns `{ redirected, error, tokens }` (no Supabase-style `{ error }` only). Update the handlers to:

- if `result.error` → toast + clear loading
- if `result.redirected` → just return (browser is navigating to Google)
- otherwise the session is already set by the broker → `nav({ to: "/dashboard" })` and toast success

### 3. `src/routes/auth/callback.tsx`
Keep the file as-is for safety (broker handles redirects via `/~oauth/callback` and lands the user back at `redirect_uri = window.location.origin`, so the route isn't strictly needed anymore, but it's harmless as a fallback). No changes required.

### 4. Files we do **not** touch
- `src/integrations/lovable/index.ts` — auto-generated, never edit.
- `src/integrations/supabase/client.ts` — auto-generated.
- No `supabase--configure_social_auth` re-run needed; the provider is already enabled, the broker just bypasses the missing-secret path.

## Verification
1. `/login` → click Google → should redirect through `oauth.lovable.app`, land back on `/`, session set, `onAuthStateChange` fires, user navigates to `/dashboard`.
2. `/signup` → same flow with `prompt=select_account`.
3. Auth logs should no longer show `missing OAuth secret`.

## Not doing
- Not asking the user for Google client_id/secret (managed credentials are the whole point).
- Not changing email/password flow.
- Not adding new routes or DB migrations.
