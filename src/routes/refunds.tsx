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
          "CodeWise offers a 30-day money-back refund on Pro subscriptions. Read the full refund policy and how to request one.",
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
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-foreground/90">
          <p>
            We offer a <strong>30-day money-back guarantee</strong>. If you're not satisfied with
            your CodeWise purchase, you can request a full refund within 30 days of your order date,
            no questions asked.
          </p>

          <h2 className="font-display text-2xl">How to request a refund</h2>
          <p>
            Refunds are processed by our payment provider, <strong>Paddle</strong>, who acts as
            Merchant of Record for all CodeWise purchases. To request a refund:
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              Visit{" "}
              <a
                className="underline"
                href="https://paddle.net"
                target="_blank"
                rel="noopener noreferrer"
              >
                paddle.net
              </a>{" "}
              and enter the email address you used to purchase, then follow the prompts; or
            </li>
            <li>
              Contact us through the in-app support channel and we'll forward your request to
              Paddle.
            </li>
          </ul>

          <h2 className="font-display text-2xl">After the 30-day period</h2>
          <p>
            After 30 days we generally don't issue refunds, but you can cancel at any time to stop
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
