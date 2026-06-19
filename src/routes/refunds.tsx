import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund Policy | CodeWise" },
      {
        name: "description",
        content:
          "CodeWise offers a 30-day refund window on Pro subscriptions. Read the refund policy and the information needed for a request.",
      },
      { property: "og:url", content: "https://happy-stack-maker.lovable.app/refunds" },
    ],
    links: [{ rel: "canonical", href: "https://happy-stack-maker.lovable.app/refunds" }],
  }),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-foreground/90">
          <p>
            We offer a <strong>30-day refund window</strong> for CodeWise Pro. If the product is
            not a fit, request a refund within 30 days of the original charge date.
          </p>

          <h2 className="font-display text-2xl">How to request a refund</h2>
          <p>
            Payments are processed through <strong>Razorpay</strong>. To request a refund, contact
            us through the in-app support channel and include the billing email plus any Razorpay
            payment ID, order ID, or invoice reference you received at checkout.
          </p>

          <h2 className="font-display text-2xl">How refunds are issued</h2>
          <p>
            Approved refunds are returned to the original payment method through Razorpay. Bank,
            card, or UPI settlement times depend on the payment method and issuing institution.
          </p>

          <h2 className="font-display text-2xl">After the 30-day period</h2>
          <p>
            After 30 days we generally do not issue refunds, but you can cancel at any time to stop
            future billing. On cancellation you keep access for 7 more days as a grace period.
          </p>

          <h2 className="font-display text-2xl">Questions</h2>
          <p>
            For anything else, contact us via the in-app support channel or see our{" "}
            <Link to="/terms" className="underline">
              Terms
            </Link>
            .
          </p>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
