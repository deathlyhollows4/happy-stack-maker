import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | CodeWise" },
      {
        name: "description",
        content:
          "CodeWise terms and conditions of service, covering acceptable use, subscriptions, refunds, and account responsibilities.",
      },
      { property: "og:url", content: "https://happy-stack-maker.lovable.app/terms" },
    ],
    links: [{ rel: "canonical", href: "https://happy-stack-maker.lovable.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-2xl">1. Who we are</h2>
            <p>
              CodeWise is operated by <strong>Vidhan Tomar</strong> ("CodeWise", "we", "us"). By
              creating an account or using the service, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">2. Acceptance</h2>
            <p>
              By continued use of CodeWise you confirm you accept these Terms. If you do not agree,
              please stop using the service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">3. The service</h2>
            <p>
              CodeWise is an AI-assisted code review and learning platform for computer-science
              students. We provide reviews, mastery tracking, and practice problems. The service is
              provided on an "as is" basis and we do not guarantee uninterrupted or error-free
              operation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">4. Your account</h2>
            <p>
              You are responsible for keeping your login credentials confidential and for all
              activity under your account. You must provide accurate information and keep it up to
              date. If you are using CodeWise on behalf of an organization, you confirm you have
              authority to bind it. Individual users must be of legal age in their jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">5. Acceptable use</h2>
            <p>You must not:</p>
            <ul className="ml-6 list-disc space-y-1">
              <li>use CodeWise for any unlawful purpose, fraud or spam;</li>
              <li>infringe anyone else's intellectual property;</li>
              <li>upload malware, probe or scrape the service, or interfere with its security;</li>
              <li>
                resell, redistribute, or reverse-engineer the service or circumvent technical
                limits;
              </li>
              <li>
                misuse AI outputs (for example generating illegal content, harassment, deepfakes,
                or content that violates third-party rights).
              </li>
            </ul>
            <p>
              You are responsible for the code and prompts you submit, for verifying AI outputs, and
              for ensuring you have the right to share any code you submit for review.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">6. AI outputs and accuracy</h2>
            <p>
              CodeWise uses AI models. Outputs may be inaccurate, incomplete, or biased and are not
              a substitute for professional advice. You are responsible for reviewing outputs before
              relying on them. We may filter, restrict, or refuse outputs and may suspend accounts
              that repeatedly misuse the service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">7. Intellectual property</h2>
            <p>
              CodeWise and its software, branding, and content are owned by us. We grant you a
              limited, non-exclusive, non-transferable right to use the service under your plan. You
              retain ownership of code you submit; you grant us a limited license to host and
              process it solely to provide the service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">8. Payments, billing and refunds</h2>
            <p>
              Paid plans are billed in INR through <strong>Razorpay</strong>. By starting a paid
              subscription, you authorize recurring charges until you cancel. Checkout, renewal
              records, invoices, taxes, and payment method updates are handled through Razorpay and
              the payment methods available there.
            </p>
            <p>
              If you cancel, the subscription stops at the next renewal and you keep access for the
              remaining active period plus any grace window we show in the product. See our{" "}
              <Link className="underline" to="/refunds">
                Refund Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">9. Suspension and termination</h2>
            <p>
              We may suspend or terminate your access for material breach of these Terms,
              non-payment, security or fraud risk, or repeated or serious policy violations. On
              termination, your right to use the service ends; you can request an export of your
              data within a reasonable window before deletion.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">10. Warranties and liability</h2>
            <p>
              To the fullest extent permitted by law, we disclaim all implied warranties, including
              merchantability and fitness for purpose. Our aggregate liability is capped at the fees
              you paid in the 12 months before the claim. We are not liable for indirect,
              consequential, or special damages, for example loss of profits, data, or goodwill.
              Nothing limits liability for fraud, death, or personal injury where the law forbids
              it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">11. Indemnity</h2>
            <p>
              You agree to indemnify us against claims arising from your submitted content, your
              unlawful use of the service, or your breach of these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">12. Governing law</h2>
            <p>
              These Terms are governed by the laws of the jurisdiction where the seller is
              established. Disputes will be resolved in the competent courts there.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">13. Changes</h2>
            <p>
              We may update these Terms from time to time. Material changes will be communicated via
              the service or by email.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">14. Contact</h2>
            <p>For questions about these Terms, contact us via the in-app support channel.</p>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
