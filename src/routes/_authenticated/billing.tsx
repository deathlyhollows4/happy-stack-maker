import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
import { cancelSubscription, getCustomerPortalUrl } from "@/lib/billing.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import {
  ArrowLeft,
  ExternalLink,
  XCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing — CodeWise" }] }),
  component: BillingPage,
});

function BillingPage() {
  const { subscription, isActive, loading } = useSubscription();
  const env = getPaddleEnvironment();
  const cancelFn = useServerFn(cancelSubscription);
  const portalFn = useServerFn(getCustomerPortalUrl);
  const [busy, setBusy] = useState<"cancel" | "portal" | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const onPortal = async () => {
    setBusy("portal");
    try {
      const r = await portalFn({ data: { environment: env } });
      if (!r.ok) toast.error(r.error);
      else window.open(r.overviewUrl, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(null);
    }
  };

  const onCancel = async () => {
    setBusy("cancel");
    try {
      const r = await cancelFn({ data: { environment: env } });
      if (!r.ok) {
        toast.error(r.error);
      } else {
        toast.success(
          `Canceled. Access until ${new Date(r.accessUntil).toLocaleDateString()}.`,
        );
        setConfirmCancel(false);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3.5" /> Back to Dashboard
      </Link>

      <h1 className="font-display text-5xl tracking-tight mb-1">Billing</h1>
      <p className="text-muted-foreground mb-10">Manage your subscription, payment method, and invoices.</p>

      {loading ? (
        <p className="text-muted-foreground">Loading subscription…</p>
      ) : !subscription ? (
        <FreePlanCard />
      ) : (
        <div className="space-y-6">
          <PlanCard subscription={subscription} isActive={isActive} />

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-2xl mb-4">Actions</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onPortal}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent/10 disabled:opacity-50"
              >
                <ExternalLink className="size-4" />
                {busy === "portal" ? "Opening…" : "Manage payment & invoices"}
              </button>

              {isActive && subscription.status !== "canceled" && (
                <>
                  {!confirmCancel ? (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="size-4" /> Cancel subscription
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm text-muted-foreground">
                        You'll keep access for 7 more days. Sure?
                      </span>
                      <button
                        onClick={onCancel}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                      >
                        {busy === "cancel" ? "Canceling…" : "Yes, cancel"}
                      </button>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="text-sm text-muted-foreground hover:text-foreground px-2"
                      >
                        Keep it
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FreePlanCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Current plan
          </span>
          <h2 className="font-display text-3xl mt-1">Free</h2>
        </div>
        <span className="rounded-sm bg-muted px-2 py-1 text-[11px] font-mono text-muted-foreground">
          Active
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        50 code reviews / month · 25 practice problems / day · 100 code runs / day. Upgrade for 1500 reviews and 15 practice problems daily.
      </p>
      <Link
        to="/pricing"
        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <Sparkles className="size-4" /> Upgrade to Pro
      </Link>
    </div>
  );
}

function PlanCard({
  subscription,
  isActive,
}: {
  subscription: NonNullable<ReturnType<typeof useSubscription>["subscription"]>;
  isActive: boolean;
}) {
  const status = subscription.status;
  const endDate = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;
  const planLabel =
    subscription.price_id === "pro_yearly" ? "Pro (Yearly)" : "Pro (Monthly)";

  let statusBadge = (
    <span className="inline-flex items-center gap-1 rounded-sm bg-success/15 px-2 py-1 text-[11px] font-mono text-success">
      <CheckCircle2 className="size-3" /> Active
    </span>
  );
  let endLabel = endDate ? `Renews ${endDate}` : "Active";

  if (status === "past_due") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 rounded-sm bg-warning/15 px-2 py-1 text-[11px] font-mono text-warning">
        <AlertTriangle className="size-3" /> Payment past due
      </span>
    );
    endLabel = "Update your payment method to keep access";
  } else if (status === "canceled") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-[11px] font-mono text-muted-foreground">
        Canceled
      </span>
    );
    endLabel = isActive && endDate ? `Access until ${endDate}` : "Access ended";
  } else if (status === "trialing") {
    statusBadge = (
      <span className="inline-flex items-center gap-1 rounded-sm bg-accent/15 px-2 py-1 text-[11px] font-mono text-accent">
        Trial
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Current plan
          </span>
          <h2 className="font-display text-3xl mt-1">{planLabel}</h2>
        </div>
        {statusBadge}
      </div>
      <p className="text-sm text-muted-foreground">{endLabel}</p>
    </div>
  );
}
