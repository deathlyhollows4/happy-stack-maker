import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "../login";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Signing in… CodeWise" }] }),
  component: OAuthCallback,
});

function OAuthCallback() {
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error: err }) => {
      if (err) {
        setError(err.message);
        return;
      }
      if (data.session) {
        nav({ to: "/dashboard" });
        return;
      }
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) nav({ to: "/dashboard" });
      });
      return () => sub.subscription.unsubscribe();
    });
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
