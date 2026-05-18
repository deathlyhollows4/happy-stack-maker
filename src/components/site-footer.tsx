import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="py-10 text-center space-y-3 border-t border-border/60">
      <p className="font-mono text-xs text-muted-foreground">
        CodeWise · Built for CS students who'd rather understand than autocomplete.
      </p>
      <div className="flex justify-center gap-4 font-mono text-[11px] text-muted-foreground">
        <Link to="/explore" className="hover:text-foreground">
          Explore
        </Link>
        <Link to="/pricing" className="hover:text-foreground">
          Pricing
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
    </footer>
  );
}
