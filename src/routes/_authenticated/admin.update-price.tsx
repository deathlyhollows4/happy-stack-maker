import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicPricingConfig, formatInr, getBillingEnvironment } from "@/lib/payments";
import { requireAdminRoute } from "@/lib/admin-route";
import { Shield, RefreshCw, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/update-price")({
  head: () => ({ meta: [{ title: "Billing Prices | CodeWise" }] }),
  beforeLoad: requireAdminRoute,
  component: UpdatePricePage,
});

function UpdatePricePage() {
  const getPricingConfig = useServerFn(getPublicPricingConfig);
  const { data } = useQuery({
    queryKey: ["publicPricingConfig"],
    queryFn: () => getPricingConfig(),
    staleTime: 60 * 1000,
  });
  const pricing = data?.config;
  const environment = getBillingEnvironment();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <Link
        to="/admin/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to admin
      </Link>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="size-5 text-accent" />
          <h2 className="font-display text-xl">Billing price checklist</h2>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Public pricing uses admin-config values. Checkout amounts in Razorpay should match the
          same monthly and yearly INR values before you switch traffic.
        </p>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-background p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Monthly
            </p>
            <p className="mt-2 font-display text-3xl">
              {pricing ? formatInr(pricing.proMonthlyInr) : "--"}
            </p>
          </div>
          <div className="rounded-md border border-border bg-background p-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Yearly
            </p>
            <p className="mt-2 font-display text-3xl">
              {pricing ? formatInr(pricing.proYearlyInr) : "--"}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Active environment: <span className="font-mono text-foreground">{environment}</span>
          </p>
          <p>1. Update the public display amounts in Admin Settings if the INR price changes.</p>
          <p>2. Confirm the Razorpay plan or order amount matches those values.</p>
          <p>3. Run one test checkout in sandbox before updating live traffic.</p>
        </div>

        <Link
          to="/admin/settings"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="size-4" /> Review site settings
        </Link>
      </div>
    </div>
  );
}
