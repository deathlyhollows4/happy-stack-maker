import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
import { cancelSubscription } from "@/lib/billing.functions";
import {
  DEFAULT_PRICING_CONFIG,
  formatInr,
  getBillingProviderLabel,
  getFreePlanFeatures,
  getPlanPrice,
  getProPlanFeatures,
  getProPlanLabel,
  getPublicPricingConfig,
} from "@/lib/payments";
import {
  ArrowLeft,
  XCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing | CodeWise" }] }),
  component: BillingPage,
});

function BillingPage() {
  const { subscription, isActive, loading, environment } = useSubscription();
  const getPricingConfig = useServerFn(getPublicPricingConfig);
  const cancelFn = useServerFn(cancelSubscription);
  const [busy, setBusy] = useState<"cancel" | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { data } = useQuery({
    queryKey: ["publicPricingConfig"],
    queryFn: () => getPricingConfig(),
    staleTime: 60 * 1000,
  });
  const pricing = data?.ok ? data.config : DEFAULT_PRICING_CONFIG;
  const providerLabel = getBillingProviderLabel();
  const canCancelRenewal = subscription?.provider_subscription_id?.startsWith("sub_") ?? false;

  const onCancel = async () => {
    setBusy("cancel");
    try {
      const result = await cancelFn({ data: { environment } });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Canceled. Access until ${new Date(result.accessUntil).toLocaleDateString()}.`);
      setConfirmCancel(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to Dashboard
      </Link>

      <h1 className="mb-1 font-display text-5xl tracking-tight">Billing</h1>
      <p className="mb-10 text-muted-foreground">
        Manage your subscription status and billing portal access.
      </p>

      {loading ? (
        <p className="text-muted-foreground">Loading subscription...</p>
      ) : !subscription ? (
        <FreePlanCard pricing={pricing} />
      ) : (
        <div className="space-y-6">
          <PlanCard subscription={subscription} isActive={isActive} pricing={pricing} />

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-2xl">Actions</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Billing runs through {providerLabel}. Prices are billed in INR. Contact support if
              anything looks off after migration.
            </p>
            <div className="flex flex-wrap gap-2">
              {isActive && subscription.status !== "canceled" && canCancelRenewal && (
                <>
                  {!confirmCancel ? (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="size-4" /> Cancel subscription
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Cancellation stops the next renewal. You keep access for 7 days.
                      </span>
                      <button
                        onClick={onCancel}
                        disabled={busy !== null}
                        className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                      >
                        {busy === "cancel" ? "Canceling..." : "Yes, cancel"}
                      </button>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="px-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        Keep it
                      </button>
                    </div>
                  )}
                </>
              )}
              {isActive && subscription.status !== "canceled" && !canCancelRenewal && (
                <span className="text-sm text-muted-foreground">
                  This purchase does not renew automatically.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FreePlanCard({ pricing }: { pricing: typeof DEFAULT_PRICING_CONFIG }) {
  const freeFeatures = getFreePlanFeatures(pricing);
  const proFeatures = getProPlanFeatures(pricing);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Current plan
          </span>
          <h2 className="mt-1 font-display text-3xl">Free</h2>
        </div>
        <span className="rounded-sm bg-muted px-2 py-1 text-[11px] font-mono text-muted-foreground">
          Active
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {freeFeatures.join(", ")}. Upgrade for {proFeatures[0]} and {proFeatures[1]}.
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
  pricing,
}: {
  subscription: NonNullable<ReturnType<typeof useSubscription>["subscription"]>;
  isActive: boolean;
  pricing: typeof DEFAULT_PRICING_CONFIG;
}) {
  const status = subscription.status;
  const endDate = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;
  const planLabel = getProPlanLabel(subscription.price_id);
  const planPrice = formatInr(getPlanPrice(pricing, subscription.price_id));

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
    <div className="space-y-3 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Current plan
          </span>
          <h2 className="mt-1 font-display text-3xl">{planLabel}</h2>
        </div>
        {statusBadge}
      </div>
      <p className="text-sm text-muted-foreground">
        {planPrice} / {subscription.price_id?.includes("year") ? "year" : "month"} billed in INR.
      </p>
      <p className="text-sm text-muted-foreground">{endLabel}</p>
    </div>
  );
}
