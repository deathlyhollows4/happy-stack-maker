import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — CodeWise" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    nav({ to: "/dashboard" });
  };

  return <AuthShell title="Welcome back" subtitle="Sign in to keep reviewing.">
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <button disabled={loading} className="w-full rounded-md bg-primary text-primary-foreground py-2.5 font-medium hover:opacity-90 transition disabled:opacity-50">
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
    <p className="mt-6 text-center text-sm text-muted-foreground">
      No account? <Link to="/signup" className="text-primary hover:underline">Create one</Link>
    </p>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center">
          <Link to="/" className="font-bold tracking-tight flex items-center gap-2">
            <span className="size-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-mono">{"</>"}</span>
            CodeWise
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          <div className="rounded-lg border border-border bg-card p-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function Field({ label, type, value, onChange, autoComplete }: { label: string; type: string; value: string; onChange: (v: string) => void; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <input
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-input px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
