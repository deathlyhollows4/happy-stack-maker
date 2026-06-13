import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTopicBySlug } from "@/lib/codewise.functions";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  BarChart3,
  Zap,
  Target,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Link2,
  Hash,
  Clock,
  Cpu,
} from "lucide-react";

export const Route = createFileRoute("/learn/$slug")({
  head: ({ params }) => ({
    meta: [
      {
        title: `${capitalize(params.slug)} DSA Guide | Learn, Practice, Master | CodeWise`,
      },
      {
        name: "description",
        content: `Master ${capitalize(params.slug)} with CodeWise. Learn core concepts, time complexity breakdowns, common patterns, MAANG interview frequency, and get code review feedback.`,
      },
      {
        property: "og:title",
        content: `${capitalize(params.slug)} DSA Guide | Learn, Practice, Master | CodeWise`,
      },
      {
        property: "og:description",
        content: `CodeWise helps CS students master ${capitalize(params.slug)} with code reviews and personalised practice problems.`,
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

function topicDisplayName(slug: string): string {
  if (slug.length <= 3 && slug === slug.toLowerCase()) return slug.toUpperCase();
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function capitalize(slug: string): string {
  return topicDisplayName(slug);
}

function frequencyColor(freq: string) {
  if (freq === "Very High") return "text-red-500 bg-red-500/10";
  if (freq === "High") return "text-amber-500 bg-amber-500/10";
  if (freq === "Medium") return "text-blue-500 bg-blue-500/10";
  return "text-muted-foreground bg-muted";
}

function LearnPage() {
  const { slug } = useParams({ from: "/learn/$slug" });
  const fn = useServerFn(getTopicBySlug);
  const { data, isLoading, error } = useQuery({
    queryKey: ["topicBySlug", slug],
    queryFn: () => fn({ data: { slug } }),
    enabled: !!slug,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const topic = data?.topic ?? null;
  const related = data?.related ?? [];
  const displayName = capitalize(slug);
  const edu = topic
    ? {
        description: topic.description ?? "",
        overview: topic.overview ?? "",
        operations: (topic.operations as any[]) ?? [],
        commonPatterns: (topic.common_patterns as any[]) ?? [],
        whenToUse: topic.when_to_use ?? "",
        whenToAvoid: topic.when_to_avoid ?? "",
        maangFrequency: topic.maang_frequency ?? "Medium",
        prerequisites: (topic.prerequisites as string[]) ?? [],
      }
    : null;

  if (error || (!isLoading && !topic)) {
    return <NotFound slug={slug} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="learn" />

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
            {/* Hero */}
            <section className="border-b border-border">
              <div className="max-w-6xl mx-auto px-8 py-24">
                <Link
                  to="/learn"
                  className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  &lt;- All topics
                </Link>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {topic.category}
                </p>
                <h1 className="mt-4 font-display text-6xl tracking-tight md:text-7xl">
                  {topic.name}
                </h1>
                {edu && (
                  <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                    {edu.description}
                  </p>
                )}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/practice"
                    search={{ topic: slug }}
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

            {/* Prerequisites */}
            {edu?.prerequisites && edu.prerequisites.length > 0 && (
              <section className="border-b border-border bg-card/30">
                <div className="max-w-4xl mx-auto px-8 py-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Link2 className="size-5 text-accent" />
                    <h2 className="font-display text-2xl">Prerequisites</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    These topics are prerequisites for {topic.name}. We recommend reviewing them first.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {edu.prerequisites.map((pre) => (
                      <Link
                        key={pre}
                        to="/learn/$slug"
                        params={{ slug: pre }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm hover:border-accent/40 hover:text-accent transition-colors"
                      >
                        <ChevronRight className="size-3.5" />
                        {topicDisplayName(pre)}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Educational content */}
            {edu && (
              <>
                {/* Concept Overview */}
                <section className="border-b border-border">
                  <div className="max-w-4xl mx-auto px-8 py-14">
                    <div className="flex items-center gap-3 mb-6">
                      <Lightbulb className="size-5 text-accent" />
                      <h2 className="font-display text-2xl">Concept Overview</h2>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground max-w-3xl">
                      {edu.overview}
                    </p>
                  </div>
                </section>

                {/* Operations Table */}
                <section className="border-b border-border bg-card/30">
                  <div className="max-w-4xl mx-auto px-8 py-14">
                    <div className="flex items-center gap-3 mb-6">
                      <BarChart3 className="size-5 text-accent" />
                      <h2 className="font-display text-2xl">Key Operations & Complexity</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="py-3 pr-6 font-medium">Operation</th>
                            <th className="py-3 pr-6 font-medium">
                              <span className="inline-flex items-center gap-1"><Clock className="size-3" /> Time</span>
                            </th>
                            <th className="py-3 font-medium">
                              <span className="inline-flex items-center gap-1"><Cpu className="size-3" /> Space</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {edu.operations.map((op) => (
                            <tr key={op.name} className="border-b border-border/50">
                              <td className="py-3 pr-6 text-foreground">{op.name}</td>
                              <td className="py-3 pr-6 font-mono text-accent">{op.time}</td>
                              <td className="py-3 font-mono text-muted-foreground">{op.space}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* Common Patterns + When to Use/Avoid */}
                <section className="border-b border-border">
                  <div className="max-w-4xl mx-auto px-8 py-14 grid gap-10 md:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="size-5 text-accent" />
                        <h2 className="font-display text-xl">Common Patterns</h2>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {edu.commonPatterns.map((p) => (
                          <Link
                            key={p.slug}
                            to="/learn/$slug"
                            params={{ slug: p.slug }}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent hover:bg-accent/20 transition-colors"
                          >
                            <Hash className="size-3" />
                            {p.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="size-5 text-accent" />
                        <h2 className="font-display text-xl">MAANG Frequency</h2>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-xs ${frequencyColor(edu.maangFrequency)}`}>
                        <Target className="size-3" />
                        {edu.maangFrequency}
                      </span>
                    </div>
                  </div>
                </section>

                {/* When to Use / Avoid */}
                <section className="border-b border-border bg-card/30">
                  <div className="max-w-4xl mx-auto px-8 py-14 grid gap-10 md:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="size-5 text-green-500" />
                        <h2 className="font-display text-xl">When to Use</h2>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {edu.whenToUse}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="size-5 text-amber-500" />
                        <h2 className="font-display text-xl">When to Avoid</h2>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {edu.whenToAvoid}
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Related topics */}
            {related.length > 0 && (
              <section className="border-b border-border">
                <div className="max-w-6xl mx-auto px-8 py-16">
                  <h2 className="font-display text-3xl mb-8">Related {topic.category} topics</h2>
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
                          Learn {t.name.toLowerCase()} -&gt;
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Bottom CTA */}
            <section className="bg-card/40">
              <div className="max-w-3xl mx-auto px-8 py-24 text-center">
                <Sparkles className="mx-auto size-6 text-accent" />
                <h2 className="mt-4 font-display text-4xl">Practice this topic</h2>
                <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                  Get code review feedback focused on the CS concepts you need to strengthen.
                </p>
                <Link
                  to="/signup"
                  className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
                >
                  Start free review <ArrowRight className="size-4" />
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="learn" />
      <main className="max-w-xl mx-auto px-8 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Topic not found
        </p>
        <h1 className="mt-4 font-display text-4xl">{capitalize(slug)}</h1>
        <p className="mt-4 text-muted-foreground">
          We don't have a dedicated page for this topic yet. Check out the topics we do cover below.
        </p>
        <Link
          to="/learn"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <ArrowRight className="size-4" /> Browse topics
        </Link>
      </main>
    </div>
  );
}
