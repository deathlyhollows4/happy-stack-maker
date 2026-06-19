import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const SAMPLE_CODE = `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`;

export const Route = createFileRoute("/demo-review")({
  head: () => ({
    meta: [
      { title: "Demo Review | CodeWise" },
      {
        name: "description",
        content:
          "Try a sample CodeWise review before creating an account. See DSA concept feedback, mastery signals, and targeted practice.",
      },
      { property: "og:title", content: "Demo Review | CodeWise" },
      {
        property: "og:description",
        content:
          "Try a sample CodeWise review before creating an account. See DSA concept feedback, mastery signals, and targeted practice.",
      },
      { property: "og:url", content: "https://happy-stack-maker.lovable.app/demo-review" },
    ],
    links: [{ rel: "canonical", href: "https://happy-stack-maker.lovable.app/demo-review" }],
  }),
  component: DemoReviewPage,
});

function DemoReviewPage() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const review = useMemo(() => buildDemoReview(code), [code]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader active="home" />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Public demo
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl tracking-tight sm:text-5xl md:text-6xl">
              See how CodeWise teaches from code.
            </h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              This demo runs in your browser and does not store code. Create an account when you are
              ready for live AI review, saved progress, and personalized practice.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Paste code</h2>
              <span className="rounded-sm bg-muted px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Python demo
              </span>
            </div>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              className="min-h-[360px] w-full resize-y rounded-md border border-border bg-input p-4 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Demo feedback is rule-based. Account reviews use the full CodeWise AI reviewer.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">Sample review</h2>
              <div className="text-right">
                <div className="font-display text-3xl text-accent">{review.mastery}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  mastery
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{review.summary}</p>

            <div className="mt-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Concepts identified
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {review.concepts.map((concept) => (
                  <span
                    key={concept}
                    className="rounded-sm bg-accent/10 px-2.5 py-1 font-mono text-[11px] text-accent"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {review.issues.map((issue) => (
                <div
                  key={issue.title}
                  className="rounded-md border border-border bg-background p-4"
                >
                  <p className="font-medium">{issue.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{issue.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/learn/$slug"
                params={{ slug: "hashing" }}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent/10"
              >
                <Code2 className="h-4 w-4" /> Learn hashing
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-accent" />
            <h2 className="mt-4 font-display text-4xl">What changes after signup?</h2>
            <p className="mt-4 text-muted-foreground">
              Account reviews are saved, mapped to your mastery graph, and used to generate targeted
              practice for your weakest topics.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function buildDemoReview(code: string) {
  const normalized = code.toLowerCase();
  const hasNestedLoop =
    normalized.includes("for ") && normalized.indexOf("for ") !== normalized.lastIndexOf("for ");
  const hasHashMap =
    normalized.includes("dict") ||
    normalized.includes("{}") ||
    normalized.includes("map") ||
    normalized.includes("set");

  if (hasNestedLoop && !hasHashMap) {
    return {
      mastery: 62,
      summary:
        "The code is correct for many two-sum inputs, but it uses a nested scan. CodeWise would connect that issue to hashing and time complexity, then suggest a focused improvement.",
      concepts: ["arrays", "hashing", "complexity"],
      issues: [
        {
          title: "Nested scan increases runtime",
          body: "The inner loop makes the solution O(n^2). A hash map lets you ask whether the needed complement was already seen in average O(1) time.",
        },
        {
          title: "Practice target",
          body: "A good next exercise is Contains Duplicate or Two Sum with a map, because both train fast membership lookup.",
        },
      ],
    };
  }

  return {
    mastery: 78,
    summary:
      "The code shows a stronger lookup pattern. CodeWise would still check edge cases, explain the invariant, and connect the solution to future practice.",
    concepts: ["hashing", "arrays", "complexity"],
    issues: [
      {
        title: "State the invariant",
        body: "For lookup-based solutions, explain what each key means and when it is inserted. That makes correctness easier to verify.",
      },
      {
        title: "Check edge cases",
        body: "Test empty input, repeated values, and cases where no answer exists before submitting.",
      },
    ],
  };
}
