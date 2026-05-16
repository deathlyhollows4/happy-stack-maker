import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, GraduationCap, LineChart, Code2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeWise. AI code reviewer for CS students" },
      {
        name: "description",
        content:
          "Unlike Copilot, CodeWise diagnoses the CS concepts you haven't mastered. Pedagogical multi-language reviews with knowledge tracing across DSA topics.",
      },
      { property: "og:title", content: "CodeWise. AI code reviewer for CS students" },
      { property: "og:description", content: "Pedagogical AI code review with knowledge tracing." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
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
            <Link to="/login" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            For CS students preparing for placements
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-6xl leading-[1.05] tracking-tight md:text-7xl">
            AI code review that <em className="text-accent">teaches</em>, not just fixes.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Unlike Copilot or CodeRabbit, CodeWise diagnoses the underlying CS concepts you haven't
            yet mastered. Every review explains <em>why</em> you made an error, traces mastery
            across 20+ DSA topics, and generates practice problems at your exact skill level.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start your first review <ArrowRight className="h-4 w-4" />
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
                Correct logic, but O(n²). You're not yet using a hash map to trade space for time, a
                foundational pattern for the rest of the curriculum.
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
                  <li>· Contains Duplicate (easy)</li>
                  <li>· Group Anagrams (medium)</li>
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
            body="Reviews explain the CS principle behind every suggestion, not just the syntax fix. Like a patient TA with infinite office hours."
          />
          <Feature
            icon={<LineChart className="h-5 w-5" />}
            title="Knowledge tracing"
            body="Bayesian mastery score per topic across 20+ DSA concepts. Watch your weak spots shrink as you submit more code."
          />
          <Feature
            icon={<Code2 className="h-5 w-5" />}
            title="Multi-language"
            body="Python, Java, C++, and JavaScript. Real syntax highlighting in a real editor, not a textarea pretending to be one."
          />
        </div>
      </section>

      <section className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-accent" />
          <h2 className="mt-4 font-display text-5xl">Ready when you are.</h2>
          <p className="mt-4 text-muted-foreground">
            Your first review is free. No credit card. No "premium" gate on the things that matter.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="py-10 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          CodeWise · Built for CS students who'd rather understand than autocomplete.
        </p>
      </footer>
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
