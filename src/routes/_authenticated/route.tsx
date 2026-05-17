import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter } from "@/components/site-footer";
import {
  LayoutDashboard,
  Code2,
  Sparkles,
  LogOut,
  Settings as SettingsIcon,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
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
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const { subscription } = useSubscription();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  // Checkout success toast (consumed once)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("checkout") === "success") {
      toast.success("You're subscribed. Welcome to Pro 🎉");
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

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
    { to: "/billing", icon: CreditCard, label: "Billing" },
    { to: "/settings", icon: SettingsIcon, label: "Settings" },
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
            const active = path === it.to || path.startsWith(it.to + "/");
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
        <div className="p-3 border-t border-border/60 space-y-3">
          <div className="px-3 py-2 text-xs text-muted-foreground font-mono truncate">
            {user.email}
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition"
          >
            <LogOut className="size-4" /> Sign out
          </button>
          <div className="px-3 pt-2 border-t border-border/40">
            <SiteFooter compact />
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {subscription?.status === "past_due" && (
          <div className="bg-warning/15 border-b border-warning/30 px-6 py-2.5 text-sm text-warning-foreground flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              Your last payment failed. Update your card to keep Pro access.
            </span>
            <Link to="/billing" className="font-medium underline underline-offset-4">
              Fix billing →
            </Link>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
