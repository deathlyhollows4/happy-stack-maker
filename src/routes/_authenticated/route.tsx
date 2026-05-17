import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
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
  CreditCard,
  AlertTriangle,
  Menu,
  X,
  ChevronDown,
  User,
  Settings as SettingsIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/review", icon: Code2, label: "Review" },
  { to: "/practice", icon: Sparkles, label: "Practice" },
  { to: "/billing", icon: CreditCard, label: "Billing" },
  { to: "/settings", icon: SettingsIcon, label: "Settings" },
] as const;

function AuthLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({
    select: (s) => s.location.search as Record<string, unknown>,
  });
  const { subscription } = useSubscription();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("checkout") === "success") {
      toast.success("You're subscribed. Welcome to Pro 🎉");
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

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

  const isActive = (to: string) =>
    path === to || path.startsWith(to + "/");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display text-xl">CodeWise</span>
            <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
              beta
            </span>
          </Link>

          {/* Desktop nav: centered */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {NAV_ITEMS.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive(it.to)
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                }`}
              >
                <it.icon className="size-4" />
                {it.label}
              </Link>
            ))}
          </nav>

          {/* Right side: user menu + mobile hamburger */}
          <div className="flex items-center gap-2">
            {/* Desktop user dropdown */}
            <div className="hidden md:block relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              >
                <User className="size-4" />
                <span className="max-w-[160px] truncate">{user.email}</span>
                <ChevronDown
                  className={`size-3 transition-transform ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-md border border-border bg-popover shadow-lg z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive(it.to)
                      ? "bg-accent/15 text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <it.icon className="size-4" />
                  {it.label}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-border">
                <p className="px-3 text-xs font-mono text-muted-foreground truncate mb-2">
                  {user.email}
                </p>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Past-due banner */}
      {subscription?.status === "past_due" && (
        <div className="bg-warning/15 border-b border-warning/30 px-6 py-2.5 text-sm text-warning-foreground flex items-center justify-between gap-3 flex-wrap">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            Your last payment failed. Update your card to keep Pro access.
          </span>
          <Link
            to="/billing"
            className="font-medium underline underline-offset-4"
          >
            Fix billing →
          </Link>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Site footer */}
      <SiteFooter />
    </div>
  );
}
