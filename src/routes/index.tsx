import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, GraduationCap, LineChart, Code2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FEATURED_TOPICS = [
  {
    name: "Arrays",
    slug: "arrays",
    description: "Build confidence with traversal, indexing, and two-pointer patterns.",
  },
  {
    name: "Hash Tables",
    slug: "hashing",
    description: "Practice fast lookups, frequency maps, grouping, and duplicate checks.",
  },
  {
    name: "Graphs",
    slug: "graphs",
    description: "Review reachability, traversal, components, and path-finding ideas.",
  },
  {
    name: "Dynamic Programming",
    slug: "dp",
    description: "Learn to spot repeated subproblems and reuse previous answers.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeWise. AI code reviewer for CS students" },
      {
        name: "description",
        content:
          "CodeWise diagnoses the CS concepts you haven't mastered. Pedagogical multi-language code reviews with knowledge tracing across DSA topics.",
      },
      { property: "og:title", content: "CodeWise. AI code reviewer for CS students" },
      {
        property: "og:description",
        content:
          "CodeWise diagnoses the CS concepts you haven't mastered. Pedagogical multi-language code reviews with knowledge tracing across DSA topics.",
      },
      { property: "og:url", content: "https://happy-stack-maker.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://happy-stack-maker.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CodeWise",
          url: "https://happy-stack-maker.lovable.app/",
          description:
            "AI code reviews for CS students mapped to DSA concepts, with topic mastery tracking and practice problems.",
          publisher: {
            "@type": "Organization",
            name: "CodeWise",
            url: "https://happy-stack-maker.lovable.app/",
          },
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("checkout") === "success") {
      toast.success("Checkout complete. Pro access is updating.");
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader hasSession={hasSession} active="home" />

      <main>
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              For CS students preparing for placements
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-4xl leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              AI code review that <em className="text-accent">teaches</em>, not just fixes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Unlike Copilot or CodeRabbit, CodeWise diagnoses the underlying CS concepts you
              haven't yet mastered. Every review explains <em>why</em> you made an error, traces
              mastery across 20+ DSA topics, and generates practice problems at your exact skill
              level.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/demo-review"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Try demo review <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        {/* Mock review preview */}
        <section className="border-b border-border/60 bg-card/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              A review, in seconds
            </p>
            <h2 className="mt-3 font-display text-4xl">From submission to insight.</h2>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">two_sum.py</span>
                  <span className="rounded-sm bg-muted px-2 py-0.5 font-mono uppercase tracking-wider text-muted-foreground">
                    Python
                  </span>
                </div>
                <pre className="mt-4 overflow-x-auto font-mono text-xs leading-relaxed text-foreground/90">
                  <code>{`def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i+1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`}</code>
                </pre>
              </div>

              <div className="space-y-4 rounded-lg border border-border bg-background p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl">Review</h3>
                  <div className="text-right">
                    <div className="font-display text-3xl text-accent">62</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      mastery
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Correct logic, but O(n^2). You're not yet using a hash map to trade space for
                  time, a foundational pattern for the rest of the curriculum.
                </p>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Concepts identified
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["Arrays", "Time complexity", "Hash maps (gap)"].map((c) => (
                      <span
                        key={c}
                        className="rounded-sm bg-muted px-2 py-1 font-mono text-[11px] text-foreground/80"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    Suggested practice
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>- Contains Duplicate (easy)</li>
                    <li>- Group Anagrams (medium)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/60">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-3">
            <Feature
              icon={<GraduationCap className="h-5 w-5" />}
              title="Pedagogical, not punitive"
              body="Reviews explain the CS principle behind every suggestion, not just the syntax fix."
            />
            <Feature
              icon={<LineChart className="h-5 w-5" />}
              title="Knowledge tracing"
              body="Bayesian mastery score per topic across 20+ DSA concepts. Tracks your progress on each topic as you submit more code."
            />
            <Feature
              icon={<Code2 className="h-5 w-5" />}
              title="Multi-language"
              body="Python, Java, C++, and JavaScript. Real syntax highlighting in a real editor, not a textarea pretending to be one."
            />
          </div>
        </section>

        <section className="border-b border-border/60 bg-card/40">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Featured topics
                </p>
                <h2 className="mt-3 font-display text-4xl">Start with high-signal CS concepts.</h2>
              </div>
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent"
              >
                View all topics <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_TOPICS.map((topic) => (
                <Link
                  key={topic.slug}
                  to="/learn/$slug"
                  params={{ slug: topic.slug }}
                  className="group rounded-lg border border-border bg-background p-5 hover:border-accent/40 transition-colors"
                >
                  <h3 className="font-display text-xl group-hover:text-accent transition-colors">
                    {topic.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {topic.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/60">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="rounded-lg border border-border bg-card p-8 md:flex md:items-center md:justify-between md:gap-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Latest from the blog
                </p>
                <h2 className="mt-3 font-display text-4xl">Resources for CS students.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Read guides on DSA patterns, code review habits, and learning strategies.
                </p>
              </div>
              <Link
                to="/blog"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 md:mt-0"
              >
                Read the blog <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 bg-card/40">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-accent" />
            <h2 className="mt-4 font-display text-5xl">Ready when you are.</h2>
            <p className="mt-4 text-muted-foreground">
              Start free with 50 code reviews per month. Paid plans are billed in INR through
              Razorpay.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start free reviews <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/15 text-accent">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-2xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
