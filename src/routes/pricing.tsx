import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { usePaddleCheckout } from "@/hooks/use-paddle-checkout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — CodeWise" },
      {
        name: "description",
        content:
          "CodeWise Pro: 1500 code reviews, all premium content, 15 roadmap generations per day, and the best AI learning resources.",
      },
    ],
  }),
  component: PricingPage,
});

const FREE_FEATURES = [
  "5 code reviews / month",
  "Mastery tracking across DSA topics",
  "1 roadmap generation / day",
];

const PRO_FEATURES = [
  "1500 code reviews / month",
  "15 roadmap generations / day",
  "Priority support",
];

function PricingPage() {
  const { user } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const { openCheckout, loading } = usePaddleCheckout();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: "pro_monthly" | "pro_yearly") => {
    if (!user) {
      navigate({ to: "/signup" });
      return;
    }
    await openCheckout({
      priceId,
      customerEmail: user.email,
      customData: { userId: user.id },
      successUrl: `${window.location.origin}/?checkout=success`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PaymentTestModeBanner />
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-display text-2xl">
            CodeWise
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/pricing" className="text-foreground">
              Pricing
            </Link>
            {user ? (
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
            ) : (
              <Link to="/login" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Pricing
        </p>
        <h1 className="mt-4 font-display text-5xl md:text-6xl">
          Simple plans. <em className="text-accent">Real</em> learning.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Start free. Upgrade when you're serious about mastering the concepts behind your code.
        </p>

        {isActive && !subLoading && (
          <div className="mt-8 rounded-md border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
            You're on <strong>CodeWise Pro</strong>. Thanks for supporting the project.
          </div>
        )}

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Free */}
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="font-display text-2xl">Free</h2>
            <p className="mt-1 text-sm text-muted-foreground">Get a feel for it.</p>
            <div className="mt-6">
              <span className="font-display text-5xl">$0</span>
              <span className="ml-1 text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-accent" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to={user ? "/app" : "/signup"}
              className="mt-8 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent/10"
            >
              {user ? "Go to dashboard" : "Get started"}
            </Link>
          </div>

          {/* Pro monthly */}
          <div className="rounded-lg border-2 border-accent bg-card/40 p-6 relative">
            <span className="absolute -top-3 left-6 rounded-sm bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent-foreground">
              Most popular
            </span>
            <h2 className="font-display text-2xl">Pro Monthly</h2>
            <p className="mt-1 text-sm text-muted-foreground">Full access, billed monthly.</p>
            <div className="mt-6">
              <span className="font-display text-5xl">$20</span>
              <span className="ml-1 text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-accent" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe("pro_monthly")}
              disabled={loading || isActive}
              className="mt-8 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isActive ? "You're subscribed" : loading ? "Loading…" : (<>Subscribe <ArrowRight className="h-4 w-4" /></>)}
            </button>
          </div>

          {/* Pro yearly */}
          <div className="rounded-lg border border-border bg-card/40 p-6">
            <h2 className="font-display text-2xl">Pro Yearly</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Save $128 vs monthly.
            </p>
            <div className="mt-6">
              <span className="font-display text-5xl">$112</span>
              <span className="ml-1 text-muted-foreground">/yr</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-accent" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe("pro_yearly")}
              disabled={loading || isActive}
              className="mt-8 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent/10 disabled:opacity-50"
            >
              {isActive ? "You're subscribed" : loading ? "Loading…" : "Subscribe yearly"}
            </button>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Payments handled by Paddle, our merchant of record. Cancel anytime — you'll keep access
          for 7 days after cancellation. See our{" "}
          <Link to="/terms" className="underline">Terms</Link>,{" "}
          <Link to="/refunds" className="underline">Refund Policy</Link>, and{" "}
          <Link to="/privacy" className="underline">Privacy Notice</Link>.
        </p>
      </section>
    </div>
  );
}
