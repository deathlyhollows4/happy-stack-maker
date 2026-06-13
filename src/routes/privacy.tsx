import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice | CodeWise" },
      {
        name: "description",
        content:
          "How CodeWise collects, uses, and shares personal data from CS students and account holders, with options to export or delete your data.",
      },
      { property: "og:url", content: "https://happy-stack-maker.lovable.app/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://happy-stack-maker.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl">Privacy Notice</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-2xl">1. Who we are</h2>
            <p>
              CodeWise is operated by <strong>Vidhan Tomar</strong> ("CodeWise", "we", "us"). For
              the purposes of data protection law, we act as the <strong>data controller</strong> of
              the personal data we collect when you use the service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">2. What data we collect</h2>
            <ul className="ml-6 list-disc space-y-1">
              <li>
                <strong>Account data</strong>: name (display name), email address, hashed password /
                OAuth identifier.
              </li>
              <li>
                <strong>User content</strong>: code you submit, prompts, generated reviews, practice
                problems, mastery scores.
              </li>
              <li>
                <strong>Usage data</strong>: pages visited, features used, timestamps, approximate
                location and device info.
              </li>
              <li>
                <strong>Support data</strong>: messages you send us.
              </li>
              <li>
                <strong>Cookies and identifiers</strong>: essential cookies for sign-in; we may use
                analytics cookies (see below).
              </li>
            </ul>
            <p className="mt-2">
              Payment information (card numbers etc.) is collected and processed directly by{" "}
              <strong>Paddle</strong> as Merchant of Record. We do not see or store your card data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">3. Why we use your data (and our legal basis)</h2>
            <ul className="ml-6 list-disc space-y-1">
              <li>
                <strong>To provide the service</strong>, create your account, run reviews, track
                mastery (contract performance).
              </li>
              <li>
                <strong>To bill you and manage subscriptions</strong>, via Paddle (contract).
              </li>
              <li>
                <strong>To keep the service secure</strong>, prevent fraud and abuse (legitimate
                interests).
              </li>
              <li>
                <strong>To improve the product</strong>, analytics, aggregated usage (legitimate
                interests).
              </li>
              <li>
                <strong>To support you</strong>, respond to questions (legitimate interests /
                contract).
              </li>
              <li>
                <strong>To send important notices</strong>, billing or service messages (legal
                obligation / legitimate interests).
              </li>
              <li>
                <strong>Marketing</strong>, only with your consent, and you can opt out at any time.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl">4. Who we share data with</h2>
            <ul className="ml-6 list-disc space-y-1">
              <li>
                <strong>Service providers / subprocessors</strong>: hosting, database, AI inference,
                analytics, and support tooling, under contract.
              </li>
              <li>
                <strong>Paddle</strong>, our Merchant of Record, for sale of the product,
                subscription management, payments, tax compliance, and invoicing.
              </li>
              <li>
                <strong>Professional advisers</strong> (legal, accounting) where necessary.
              </li>
              <li>
                <strong>Authorities</strong> where required by law.
              </li>
            </ul>
            <p className="mt-2">We do not sell your personal data.</p>
          </section>

          <section>
            <h2 className="font-display text-2xl">5. International transfers</h2>
            <p>
              Some of our service providers are located outside your country. Where data is
              transferred internationally we rely on appropriate safeguards such as Standard
              Contractual Clauses or adequacy decisions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">6. How long we keep data</h2>
            <p>
              We keep your account and content for as long as your account is active and for a
              reasonable period after, to handle disputes, comply with legal obligations, and run
              backups. After that, data is deleted or anonymised.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">7. Your rights</h2>
            <p>
              Depending on where you live, you may have rights to access, rectify, erase, restrict,
              port, or object to processing of your personal data, and to withdraw consent. EU/UK
              users have the right to complain to a supervisory authority. We will respond to
              verified requests within one month.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">8. Security</h2>
            <p>
              We use appropriate technical and organisational measures, including encryption in
              transit, access controls, and audit logging, to protect your data. No system is
              perfectly secure; please use a strong password and notify us of any suspected
              compromise.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">9. Cookies</h2>
            <p>
              We use <strong>essential</strong> cookies for sign-in and security. We may use
              <strong> analytics</strong> cookies to understand how the product is used; you can
              manage cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">10. Academic research</h2>
            <p>
              CodeWise is part of an academic study conducted at{" "}
              <strong>Army Institute of Technology, Pune</strong>, targeting publication at{" "}
              <strong>IEEE ICNDIA-2027</strong>. The study investigates the effectiveness of
              AI-assisted code review with Bayesian Knowledge Tracing for personalised CS education.
            </p>
            <p className="mt-2">
              When you opt in via the research consent banner, we collect{" "}
              <strong>anonymized usage data</strong>: which features you use, programming languages,
              topic interactions, and AI review outcomes. This data contains no names, emails, code
              content, or personally identifiable information. It is used exclusively for aggregate
              statistical analysis and never shared in identifiable form.
            </p>
            <p className="mt-2">
              Participation is entirely voluntary. You can change your preference at any time in
              Settings. Opting out does not affect your access to CodeWise features.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl">11. Contact</h2>
            <p>For privacy questions, contact us via the in-app support channel.</p>
          </section>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
