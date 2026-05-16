import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Code2, Sparkles, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return null;

  const signOut = async () => { await supabase.auth.signOut(); nav({ to: "/" }); };

  const nav_items = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/review", icon: Code2, label: "Review" },
    { to: "/practice", icon: Sparkles, label: "Practice" },
  ] as const;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r border-border bg-sidebar flex flex-col">
        <div className="h-16 px-5 flex items-center border-b border-border">
          <Link to="/" className="font-bold tracking-tight flex items-center gap-2">
            <span className="size-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-mono">{"</>"}</span>
            CodeWise
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav_items.map((it) => {
            const active = path.startsWith(it.to);
            return (
              <Link key={it.to} to={it.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                <it.icon className="size-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs text-muted-foreground font-mono truncate">{user.email}</div>
          <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><Outlet /></main>
    </div>
  );
}
