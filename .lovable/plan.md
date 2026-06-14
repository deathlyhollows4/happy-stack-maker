I found the callback page is still waiting inside the client auth/session handoff, so it can sit on “Completing sign in” forever instead of failing or continuing.

Plan:
1. Update the Google OAuth callback route to handle both callback formats:
   - implicit tokens in the URL hash: `access_token` and `refresh_token`
   - code-based callback: `code`, using the auth client’s code exchange
2. Add a short auth-state race so the page redirects as soon as a session exists, instead of depending on one promise path.
3. Add a timeout fallback that checks for an existing session, then either redirects to `/dashboard` or shows a real error with a retry link. No more infinite spinner.
4. Clean the callback URL only after the session is confirmed, then navigate with `replace: true`.
5. Keep the Google sign-in/start code unchanged unless the callback inspection shows the redirect URL itself is wrong.

Technical notes:
- Primary file: `src/routes/auth/callback.tsx`
- Possible related checks: `src/lib/auth-helpers.ts`, `_authenticated` route guard
- Before editing the callback symbol, I’ll run impact analysis and report the blast radius.