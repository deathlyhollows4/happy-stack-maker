import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="py-10 text-center space-y-3 border-t border-border/60">
      <p className="font-mono text-xs text-muted-foreground">
        CodeWise · Built for CS students who'd rather understand than autocomplete.
      </p>
      <div className="flex justify-between px-4 max-w-4xl mx-auto font-mono text-[11px] text-muted-foreground">
        <div className="flex gap-4">
          <Link to="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link to="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
        </div>
        <div className="flex gap-4">
          <Link to="/explore" className="hover:text-foreground">
            Explore
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link to="/refunds" className="hover:text-foreground">
            Refunds
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
