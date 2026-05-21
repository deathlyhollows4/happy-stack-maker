import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter } from "@/components/site-footer";

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
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl">CodeWise</span>
            <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
              beta
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              to={hasSession ? "/dashboard" : "/login"}
              className="text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            {hasSession ? null : (
              <Link to="/signup" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Get started
              </Link>
            )}
          </nav>
        </div>
      </header>

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
