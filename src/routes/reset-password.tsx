import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password | CodeWise" }] }),
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIP(request);
        const { allowed, resetIn } = checkRateLimit(ip);
        if (!allowed) {
          return new Response(
            JSON.stringify({ error: "Too many requests. Please try again later." }),
            {
              status: 429,
              headers: {
                "content-type": "application/json",
                "retry-after": String(Math.ceil(resetIn / 1000)),
              },
            },
          );
        }
        return new Response(null, { status: 204 });
      },
    },
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);

    toast.success("Password updated. Signing you in…");

    // Wait for the new signed-in session after password reset.
    // updateUser resolves before the auth state change fires, so if we
    // navigate to /dashboard immediately the _authenticated layout's
    // beforeLoad sees no session and redirects back to /login.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        sub.subscription.unsubscribe();
        nav({ to: "/dashboard" });
      }
    });

    // Fallback: if onAuthStateChange doesn't fire within 5s, try getSession
    setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        sub.subscription.unsubscribe();
        nav({ to: "/dashboard" });
      }
    }, 5000);
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password for your account.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <Field
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />
        <button
          disabled={loading}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? "Updating…" : "Set password"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="text-accent underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
