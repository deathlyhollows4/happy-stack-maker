import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AuthShell } from "../login";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Signing in... | CodeWise" }] }),
  component: OAuthCallback,
});

function OAuthCallback() {
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Consume the OAuth response tokens left in the URL by the Lovable broker.
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: `${window.location.origin}/auth/callback`,
        });

        if (cancelled) return;

        if (result?.error) {
          setError(result.error.message ?? "Sign in failed.");
          return;
        }

        // If the SDK chose to redirect again, just wait for the next load.
        if (result?.redirected) return;

        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        if (data.session) {
          nav({ to: "/dashboard" });
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
