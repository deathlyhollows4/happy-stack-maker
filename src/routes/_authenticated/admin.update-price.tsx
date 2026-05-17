import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { updateProYearlyPrice } from "@/lib/billing.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { supabase } from "@/integrations/supabase/client";
import { Shield, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/update-price")({
  head: () => ({ meta: [{ title: "Update Paddle Price | CodeWise" }] }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      p_user_id: data.session.user.id,
      p_role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: UpdatePricePage,
});

function UpdatePricePage() {
  const fn = useServerFn(updateProYearlyPrice);
  const [busy, setBusy] = useState(false);
  const env = getPaddleEnvironment();

  const handleUpdate = async () => {
    setBusy(true);
    try {
      const r = await fn({ data: { environment: env } });
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    } catch {
      toast.error("Request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        ← Back to Dashboard
      </Link>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="size-5 text-accent" />
          <h2 className="font-display text-xl">Admin: Update Pro Yearly Price</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Updates the Paddle <code className="font-mono text-xs bg-muted px-1 rounded">pro_yearly</code> price to{" "}
          <strong>$199.00 USD/year</strong> in the{" "}
          <span className="font-mono text-xs bg-muted px-1 rounded">{env}</span> environment.
        </p>

        <button
          onClick={handleUpdate}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Updating…" : "Update to $199/yr"}
        </button>
      </div>
    </div>
  );
}
