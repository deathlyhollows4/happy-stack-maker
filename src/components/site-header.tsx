import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

type SiteHeaderProps = {
  hasSession?: boolean;
  active?: "home" | "learn" | "blog" | "pricing";
};

export function SiteHeader({ hasSession = false, active }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { to: "/learn", label: "Learn", key: "learn" },
    { to: "/blog", label: "Blog", key: "blog" },
    { to: "/pricing", label: "Pricing", key: "pricing" },
  ] as const;

  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2" aria-label="CodeWise home">
          <span className="font-display text-2xl">CodeWise</span>
          <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
            beta
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <Link
              key={item.to + item.label}
              to={item.to as any}
              className={
                active === item.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              {item.label}
            </Link>
          ))}
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Link
            to={hasSession ? "/review" : "/signup"}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start free review <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {mobileOpen && (
        <nav className="border-t border-border/60 bg-background px-6 py-4 md:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to + item.label}
                to={item.to as any}
                onClick={() => setMobileOpen(false)}
                className={
                  active === item.key
                    ? "rounded-md bg-accent/15 px-3 py-2 text-sm text-accent"
                    : "rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-card hover:text-foreground"
                }
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-card hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to={hasSession ? "/review" : "/signup"}
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start free review <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
