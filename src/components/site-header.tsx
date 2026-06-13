import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

type SiteHeaderProps = {
  hasSession?: boolean;
  active?: "home" | "learn" | "blog" | "pricing";
};

export function SiteHeader({ hasSession = false, active }: SiteHeaderProps) {
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

        <nav className="flex items-center gap-5 text-sm" aria-label="Main navigation">
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
      </div>
    </header>
  );
}
