import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Clock,
  Cpu,
  Hash,
  Lightbulb,
  Link2,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { getTopicBySlug, normalizeTopicSlug, topicDisplayName } from "@/lib/topics";

export const Route = createFileRoute("/learn/$slug")({
  component: LearnPage,
});

function frequencyColor(freq: string) {
  if (freq === "Very High") return "text-red-500 bg-red-500/10";
  if (freq === "High") return "text-amber-500 bg-amber-500/10";
  if (freq === "Medium") return "text-blue-500 bg-blue-500/10";
  return "text-muted-foreground bg-muted";
}

function LearnPage() {
  const { slug } = useParams({ from: "/learn/$slug" });
  const topic = getTopicBySlug(slug);
  const canonicalSlug = normalizeTopicSlug(slug);

  if (!topic || !canonicalSlug) {
    return <NotFound slug={slug} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-8 py-24">
            <Link
              to="/learn"
              className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {"<-"} All topics
            </Link>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {topic.category}
            </p>
            <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {topic.name}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {topic.description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/practice"
                search={{ topic: canonicalSlug }}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <Sparkles className="size-4" /> Practice {topic.name} with CodeWise
              </Link>
              <Link
                to="/demo-review"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Try a sample review first
              </Link>
            </div>
          </div>
        </section>

        {topic.prerequisites.length > 0 && (
          <section className="border-b border-border bg-card/30">
            <div className="mx-auto max-w-4xl px-8 py-10">
              <div className="mb-4 flex items-center gap-3">
                <Link2 className="size-5 text-accent" />
                <h2 className="font-display text-2xl">Prerequisites</h2>
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                These topics support {topic.name}.
              </p>
              <div className="flex flex-wrap gap-2">
                {topic.prerequisites.map((pre) => (
                  <Link
                    key={pre}
                    to="/learn/$slug"
                    params={{ slug: pre }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-accent/40 hover:text-accent"
                  >
                    <ChevronRight className="size-3.5" />
                    {topicDisplayName(pre)}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="border-b border-border">
          <div className="mx-auto grid max-w-4xl gap-8 px-8 py-14 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <Lightbulb className="size-5 text-accent" />
                <h2 className="font-display text-2xl">Concept Overview</h2>
              </div>
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {topic.overview}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-display text-xl">Mental model</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {topic.mentalModel}
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card/30">
          <div className="mx-auto max-w-4xl px-8 py-14">
            <div className="mb-6 flex items-center gap-3">
              <BarChart3 className="size-5 text-accent" />
              <h2 className="font-display text-2xl">Key Operations And Complexity</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 pr-6 font-medium">Operation</th>
                    <th className="py-3 pr-6 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" /> Time
                      </span>
                    </th>
                    <th className="py-3 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Cpu className="size-3" /> Space
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topic.operations.map((op) => (
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

        <section className="border-b border-border">
          <div className="mx-auto grid max-w-4xl gap-10 px-8 py-14 md:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Zap className="size-5 text-accent" />
                <h2 className="font-display text-xl">Common Patterns</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {topic.commonPatterns.map((pattern) => (
                  <Link
                    key={pattern.slug}
                    to="/learn/$slug"
                    params={{ slug: pattern.slug }}
                    className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent transition-colors hover:bg-accent/20"
                  >
                    <Hash className="size-3" />
                    {pattern.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-4 flex items-center gap-3">
                <TrendingUp className="size-5 text-accent" />
                <h2 className="font-display text-xl">Interview Frequency</h2>
              </div>
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-xs " +
                  frequencyColor(topic.maangFrequency)
                }
              >
                <Target className="size-3" />
                {topic.maangFrequency}
              </span>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card/30">
          <div className="mx-auto grid max-w-4xl gap-6 px-8 py-14 md:grid-cols-3">
            <TeachingCard title="Worked Example" body={topic.workedExample} />
            <TeachingCard title="Quick Check" body={topic.quickCheck} />
            <div className="rounded-lg border border-border bg-background p-5">
              <h2 className="font-display text-xl">Common Mistakes</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {topic.commonMistakes.map((mistake) => (
                  <li key={mistake}>- {mistake}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="mx-auto grid max-w-4xl gap-10 px-8 py-14 md:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Zap className="size-5 text-green-500" />
                <h2 className="font-display text-xl">When To Use</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{topic.whenToUse}</p>
            </div>
            <div>
              <div className="mb-4 flex items-center gap-3">
                <AlertTriangle className="size-5 text-amber-500" />
                <h2 className="font-display text-xl">When To Avoid</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{topic.whenToAvoid}</p>
            </div>
          </div>
        </section>

        <section className="bg-card/40">
          <div className="mx-auto max-w-3xl px-8 py-24 text-center">
            <Sparkles className="mx-auto size-6 text-accent" />
            <h2 className="mt-4 font-display text-4xl">Practice ladder</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {topic.practiceLadder.map((item) => (
                <span
                  key={item}
                  className="rounded-sm bg-background px-3 py-1.5 text-sm text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Start with free reviews <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function TeachingCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function NotFound({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-xl px-8 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Topic not found
        </p>
        <h1 className="mt-4 font-display text-4xl">{topicDisplayName(slug)}</h1>
        <p className="mt-4 text-muted-foreground">
          We do not have a dedicated page for this topic yet.
        </p>
        <Link
          to="/learn"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <ArrowRight className="size-4" /> Browse topics
        </Link>
      </main>
    </div>
  );
}
