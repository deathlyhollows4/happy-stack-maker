import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Code2, Sparkles, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // Skip on the server: there is no localStorage so getSession() always returns
    // null, which would issue a spurious redirect that overwrites the just-rendered
    // dashboard on hydration/live-preview reload. The component-level gate below
    // performs the real check on the client once Supabase has restored the session.
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  const nav_items = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/review", icon: Code2, label: "Review" },
    { to: "/practice", icon: Sparkles, label: "Practice" },
  ] as const;

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 border-r border-border/60 bg-sidebar flex flex-col">
        <div className="h-16 px-5 flex items-center border-b border-border/60">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl">CodeWise</span>
            <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
              beta
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav_items.map((it) => {
            const active = path.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${active ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"}`}
              >
                <it.icon className="size-4" /> {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="px-3 py-2 text-xs text-muted-foreground font-mono truncate">
            {user.email}
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
