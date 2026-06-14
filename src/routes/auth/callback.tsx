import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "../login";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Signing in... | CodeWise" }] }),
  component: OAuthCallback,
});

function readParams(): URLSearchParams {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const fromHash = new URLSearchParams(hash);
  if (fromHash.get("access_token") || fromHash.get("error")) return fromHash;
  return new URLSearchParams(window.location.search);
}

function OAuthCallback() {
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const params = readParams();
        const errParam = params.get("error_description") || params.get("error");
        if (errParam) {
          if (!cancelled) setError(errParam);
          return;
        }

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (cancelled) return;
          if (setErr) {
            setError(setErr.message);
            return;
          }
          try {
            history.replaceState(null, "", window.location.pathname);
          } catch {
            // best-effort cleanup
          }
          nav({ to: "/dashboard", replace: true });
          return;
        }

        // Fallback: no tokens in URL — maybe session already established.
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          nav({ to: "/dashboard", replace: true });
        } else {
          setError("We couldn't complete your sign in. Please try again.");
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Sign in failed.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nav]);

  if (error) {
    return (
      <AuthShell title="Sign in failed" subtitle={error}>
        <div className="text-center">
          <Link to="/login" className="text-sm text-accent underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Completing sign in" subtitle="You'll be redirected shortly…">
      <div className="flex items-center justify-center py-6">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    </AuthShell>
  );
}
