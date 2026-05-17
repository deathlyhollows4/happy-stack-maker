import { Link } from "@tanstack/react-router";

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
        <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
        <span>·</span>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <span>·</span>
        <Link to="/refunds" className="hover:text-foreground">Refunds</Link>
        <span>·</span>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
      </div>
    );
  }
  return (
    <footer className="py-10 text-center space-y-3 border-t border-border/60">
      <p className="font-mono text-xs text-muted-foreground">
        CodeWise · Built for CS students who'd rather understand than autocomplete.
      </p>
      <div className="flex justify-center gap-4 font-mono text-[11px] text-muted-foreground">
        <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <Link to="/refunds" className="hover:text-foreground">Refunds</Link>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
      </div>
    </footer>
  );
}
