import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTopicBySlug } from "@/lib/codewise.functions";
import { ArrowRight, Sparkles, BookOpen, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/learn/$slug")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${capitalize(params.slug)} — AI Code Review Practice | CodeWise`,
      },
      {
        name: "description",
        content: `Master ${capitalize(params.slug)} with CodeWise — AI-powered code review that teaches CS concepts through pedagogical feedback and knowledge tracing.`,
      },
      {
        property: "og:title",
        content: `${capitalize(params.slug)} — AI Code Review Practice | CodeWise`,
      },
      {
        property: "og:description",
        content: `CodeWise helps CS students master ${capitalize(params.slug)} with AI-driven code reviews and personalised practice problems.`,
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:image",
        content: "https://happy-stack-maker.lovable.app/api/public/og/topics",
      },
      {
        name: "twitter:image",
        content: "https://happy-stack-maker.lovable.app/api/public/og/topics",
      },
    ],
  }),
  component: LearnPage,
});

function capitalize(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function LearnPage() {
  const { slug } = useParams({ from: "/learn/$slug" });
  const fn = useServerFn(getTopicBySlug);
  const { data, isLoading, error } = useQuery({
    queryKey: ["topicBySlug", slug],
    queryFn: () => fn({ data: { slug } }),
    enabled: !!slug,
  });

  const topic = data?.topic ?? null;
  const related = data?.related ?? [];
  const displayName = capitalize(slug);

  if (error || (!isLoading && !topic)) {
    return <NotFound slug={slug} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-lg tracking-tight">CodeWise</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent bg-accent/15 px-1.5 py-0.5 rounded-sm">
              beta
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Get started <ArrowRight className="size-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {isLoading && (
          <section className="border-b border-border">
            <div className="max-w-6xl mx-auto px-8 py-24">
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-12 w-96 bg-muted rounded" />
                <div className="h-6 w-[32rem] bg-muted rounded" />
              </div>
            </div>
          </section>
        )}

        {!isLoading && topic && (
          <>
            <section className="border-b border-border">
              <div className="max-w-6xl mx-auto px-8 py-24">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {topic.category}
                </p>
                <h1 className="mt-4 font-display text-6xl tracking-tight md:text-7xl">
                  {topic.name}
                </h1>
                {topic.description && (
                  <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                    {topic.description}
                  </p>
                )}
                <p className="mt-6 text-sm text-muted-foreground max-w-xl">
                  Strengthen your understanding of {topic.name.toLowerCase()} with CodeWise. Submit
                  code, get AI-powered pedagogical reviews that explain the underlying CS concepts,
                  and track your mastery as you improve.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
                  >
                    <Sparkles className="size-4" /> Practice {topic.name} with CodeWise
                  </Link>
                  <Link
                    to="/login"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>
            </section>

            <section className="border-b border-border bg-card/40">
              <div className="max-w-6xl mx-auto px-8 py-16">
                <h2 className="font-display text-3xl mb-8">How CodeWise helps you master {topic.name}</h2>
                <div className="grid gap-6 md:grid-cols-3">
                  <BenefitCard
                    icon={<BookOpen className="size-5" />}
                    title="Concept-first reviews"
                    body={`Our AI explains ${topic.name.toLowerCase()} errors through the lens of CS fundamentals, not just syntax fixes.`}
                  />
                  <BenefitCard
                    icon={<Sparkles className="size-5" />}
                    title="Personalised practice"
                    body={`Generate practice problems calibrated to your ${topic.name.toLowerCase()} mastery level.`}
                  />
                  <BenefitCard
                    icon={<ChevronRight className="size-5" />}
                    title="Knowledge tracing"
                    body="Watch your mastery score rise as Bayesian knowledge tracing tracks your progress across 20+ DSA topics."
                  />
                </div>
              </div>
            </section>

            {related.length > 0 && (
              <section className="border-b border-border">
                <div className="max-w-6xl mx-auto px-8 py-16">
                  <h2 className="font-display text-3xl mb-8">
                    Related {topic.category} topics
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((t) => (
                      <Link
                        key={t.slug}
                        to="/learn/$slug"
                        params={{ slug: t.slug }}
                        className="rounded-lg border border-border bg-card p-5 hover:border-accent/40 transition-colors group"
                      >
                        <h3 className="font-display text-xl group-hover:text-accent transition-colors">
                          {t.name}
                        </h3>
                        {t.description && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {t.description}
                          </p>
                        )}
                        <p className="mt-3 text-xs font-mono text-accent">
                          Learn {t.name.toLowerCase()} →
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="bg-card/40">
              <div className="max-w-3xl mx-auto px-8 py-24 text-center">
                <Sparkles className="mx-auto size-6 text-accent" />
                <h2 className="mt-4 font-display text-4xl">
                  Ready to master {topic.name}?
                </h2>
                <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                  Your first review is free. No credit card required. Get actionable feedback
                  that actually helps you learn.
                </p>
                <Link
                  to="/signup"
                  className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
                >
                  Start your first review <ArrowRight className="size-4" />
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="py-10 text-center space-y-3">
        <p className="font-mono text-xs text-muted-foreground">
          CodeWise · Built for CS students who'd rather understand than autocomplete.
        </p>
        <div className="flex justify-center gap-4 font-mono text-[11px] text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link to="/refunds" className="hover:text-foreground">
            Refunds
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-lg tracking-tight">CodeWise</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent bg-accent/15 px-1.5 py-0.5 rounded-sm">
              beta
            </span>
          </Link>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-8 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Topic not found
        </p>
        <h1 className="mt-4 font-display text-4xl">{capitalize(slug)}</h1>
        <p className="mt-4 text-muted-foreground">
          We don't have a dedicated page for this topic yet. Check out the topics we do cover below.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <ArrowRight className="size-4" /> Explore CodeWise
        </Link>
      </main>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex size-9 items-center justify-center rounded-md bg-accent/15 text-accent">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
