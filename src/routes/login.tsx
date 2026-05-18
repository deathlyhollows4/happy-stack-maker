import { SiteFooter } from "@/components/site-footer";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { signInWithGoogle } from "@/lib/auth-helpers";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in | CodeWise" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      setGoogleLoading(false);
      toast.error(result.error.message ?? "Google sign-in failed.");
      return;
    }
    if (result.redirected) return;
    toast.success("Welcome back.");
    nav({ to: "/dashboard" });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back.");
    nav({ to: "/dashboard" });
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to keep reviewing.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs text-muted-foreground hover:text-accent underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <button
          disabled={loading}
          className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={googleLoading}
        className="w-full rounded-md border border-border bg-card text-foreground py-2.5 text-sm font-medium hover:bg-accent/10 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {googleLoading ? "Redirecting…" : "Google"}
      </button>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link to="/signup" className="text-accent underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl">CodeWise</span>
            <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
              beta
            </span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="font-display text-5xl tracking-tight mb-2">{title}</h1>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          <div className="rounded-lg border border-border bg-card p-6">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <input
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
