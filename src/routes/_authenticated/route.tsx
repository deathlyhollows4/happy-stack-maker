import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter } from "@/components/site-footer";
import { ConsentBanner } from "@/components/consent-banner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Settings as SettingsIcon,
  Shield,
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
  { to: "/review", icon: Code2, label: "Review Code" },
  { to: "/practice", icon: Sparkles, label: "Practice" },
] as const;

function AuthLayout() {
  const { user, loading, isAdmin, avatarUrl, displayName } = useAuth();
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
    const checkout = url.searchParams.get("checkout");
    if (checkout === "active") {
      toast.success("Subscription active. Pro access is ready.");
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
    }
    if (checkout === "pending") {
      toast.info("Payment authorization received. Pro access starts after Razorpay confirms the subscription charge.");
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
    }
  }, [search]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  const isActive = (to: string) => path === to || path.startsWith(to + "/");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="font-display text-xl">CodeWise</span>
            <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
              beta
            </span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive(item.to)
                    ? "bg-accent/15 text-accent"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <Avatar className="size-8">
                  <AvatarImage src={avatarUrl ?? undefined} alt={displayName ?? user.email ?? ""} />
                  <AvatarFallback className="bg-accent/20 text-[10px] text-accent">
                    {(displayName ?? user.email ?? "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown
                  className={`size-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover shadow-lg">
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-medium">{displayName ?? "User"}</p>
                    <p className="truncate text-xs font-mono text-muted-foreground">{user.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                  >
                    <SettingsIcon className="size-4" /> Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                    >
                      <Shield className="size-4" /> Admin
                    </Link>
                  )}
                  <Link
                    to="/billing"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                  >
                    <CreditCard className="size-4" /> Billing
                  </Link>
                  <div className="border-t border-border" />
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                  >
                    <LogOut className="size-4" /> Sign out
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileOpen((value) => !value)}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="space-y-1 px-4 py-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive(item.to)
                      ? "bg-accent/15 text-accent"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 border-t border-border pt-3">
                <div className="mb-2 flex items-center gap-3 px-3">
                  <Avatar className="size-9">
                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName ?? user.email ?? ""} />
                    <AvatarFallback className="bg-accent/20 text-[10px] text-accent">
                      {(displayName ?? user.email ?? "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{displayName ?? "User"}</p>
                    <p className="truncate text-xs font-mono text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/settings"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                  <SettingsIcon className="size-4" /> Settings
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                  >
                    <Shield className="size-4" /> Admin
                  </Link>
                )}
                <Link
                  to="/billing"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                  <CreditCard className="size-4" /> Billing
                </Link>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {subscription?.status === "past_due" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning/15 px-6 py-2.5 text-sm text-warning-foreground">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            Your last payment did not complete. Update your billing details to keep Pro access.
          </span>
          <Link to="/billing" className="font-medium underline underline-offset-4">
            Open billing
          </Link>
        </div>
      )}

      <ConsentBanner />

      <main className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
