import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";
import { useRazorpayCheckout } from "@/hooks/use-razorpay-checkout";
import { useSubscription } from "@/hooks/use-subscription";
import {
  DEFAULT_PRICING_CONFIG,
  formatInr,
  getFreePlanFeatures,
  getProPlanFeatures,
  getPublicPricingConfig,
} from "@/lib/payments";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing | CodeWise" },
      {
        name: "description",
        content:
          "CodeWise pricing for CS students, with free and paid plans, usage limits, and cancellation terms.",
      },
      { property: "og:title", content: "Pricing | CodeWise" },
      {
        property: "og:description",
        content:
          "CodeWise pricing for CS students, with free and paid plans, usage limits, and cancellation terms.",
      },
      { property: "og:url", content: "https://happy-stack-maker.lovable.app/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://happy-stack-maker.lovable.app/pricing" }],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { user } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const getPricingConfig = useServerFn(getPublicPricingConfig);
  const { data } = useQuery({
    queryKey: ["publicPricingConfig"],
    queryFn: () => getPricingConfig(),
    staleTime: 60 * 1000,
  });
  const pricing = data?.ok ? data.config : DEFAULT_PRICING_CONFIG;
  const freeFeatures = getFreePlanFeatures(pricing);
  const proFeatures = getProPlanFeatures(pricing);
  const { openCheckout, loading } = useRazorpayCheckout();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: "pro_monthly" | "pro_yearly") => {
    if (!user) {
      navigate({ to: "/signup" });
      return;
    }

    try {
      await openCheckout({
        priceId,
        customerEmail: user.email,
        userId: user.id,
        successUrl: `${window.location.origin}/dashboard?checkout=pending`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout could not be started.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      <SiteHeader hasSession={!!user} active="pricing" />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Pricing
        </p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl md:text-6xl">
          Simple plans. <em className="text-accent">Real</em> learning.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Start free. Upgrade when you need more capacity.
        </p>

        {isActive && !subLoading && (
          <div className="mt-8 rounded-md border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
            You're on <strong>CodeWise Pro</strong>. Thanks for supporting the project.
          </div>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="font-display text-2xl">Free</h2>
            <p className="mt-1 text-sm text-muted-foreground">Get a feel for it.</p>
            <div className="mt-6">
              <span className="font-display text-5xl">Free</span>
              <span className="ml-1 text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-accent" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              to={user ? "/dashboard" : "/signup"}
              className="mt-8 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent/10"
            >
              {user ? "Go to dashboard" : "Get started"}
            </Link>
          </div>

          <div className="relative rounded-lg border-2 border-accent bg-card/40 p-6">
            <span className="absolute -top-3 left-6 rounded-sm bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent-foreground">
              Most popular
            </span>
            <h2 className="font-display text-2xl">Pro Monthly</h2>
            <p className="mt-1 text-sm text-muted-foreground">Full access, billed monthly in INR.</p>
            <div className="mt-6">
              <span className="font-display text-5xl">{formatInr(pricing.proMonthlyInr)}</span>
              <span className="ml-1 text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-accent" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe("pro_monthly")}
              disabled={loading || isActive}
              className="mt-8 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isActive ? (
                "You're subscribed"
              ) : loading ? (
                "Loading..."
              ) : (
                <>
                  Subscribe <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="font-display text-2xl">Pro Yearly</h2>
            <p className="mt-1 text-sm text-muted-foreground">Full access, billed yearly in INR.</p>
            <div className="mt-6">
              <span className="font-display text-5xl">{formatInr(pricing.proYearlyInr)}</span>
              <span className="ml-1 text-muted-foreground">/yr</span>
            </div>
            {pricing.yearlySavingsPercent > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm line-through text-muted-foreground/60">
                  {formatInr(pricing.compareAtYearlyInr)}
                </span>
                <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                  Save {pricing.yearlySavingsPercent}%
                </span>
              </div>
            )}
            <ul className="mt-6 space-y-2 text-sm">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-accent" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe("pro_yearly")}
              disabled={loading || isActive}
              className="mt-8 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent/10 disabled:opacity-50"
            >
              {isActive ? "You're subscribed" : loading ? "Loading..." : "Subscribe yearly"}
            </button>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Paid plans are billed in INR through Razorpay. Cancel anytime and keep access for 7 days
          after cancellation. See our{" "}
          <Link to="/terms" className="underline">
            Terms
          </Link>
          ,{" "}
          <Link to="/refunds" className="underline">
            Refund Policy
          </Link>
          , and{" "}
          <Link to="/privacy" className="underline">
            Privacy Notice
          </Link>
          .
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
