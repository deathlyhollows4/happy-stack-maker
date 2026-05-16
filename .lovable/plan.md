## Enable Google OAuth (managed)

Your code already calls `supabase.auth.signInWithOAuth({ provider: "google", redirectTo: .../auth/callback })` on the login and signup pages, plus a `/auth/callback` route to complete the session. The only missing piece is enabling the Google provider on the backend — no Google Cloud Console / client_id / client_secret setup needed, Lovable Cloud uses managed credentials by default.

### Step
1. Call `supabase--configure_social_auth` with `providers: ["google"]` to turn on the Google provider on your Lovable Cloud auth instance (keeps email/password enabled).

### Not doing
- No code changes. Existing login/signup/callback already work once the provider flips on.
- Not disabling email auth (you still want email+password).
- Not switching to the `lovable.auth.signInWithOAuth` broker — your current direct Supabase call works with managed Google and your committed `/auth/callback` route handles it. Migrating to the broker would change the redirect contract and require re-committing login/signup/callback; out of scope for "do the manual stuff".
- No Google Cloud Console steps — managed credentials cover it. If you later want your own branded consent screen, that's a separate task.

After this runs, Google sign-in on `/login` and `/signup` will work end-to-end.
