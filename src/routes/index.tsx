import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Code2, Sparkles, Target, TrendingUp, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeWise — AI Code Reviewer for CS Students" },
      { name: "description", content: "CodeWise diagnoses the concepts behind your code mistakes, tracks mastery across 20+ DSA topics, and generates personalized practice problems." },
      { property: "og:title", content: "CodeWise — AI Code Reviewer for CS Students" },
      { property: "og:description", content: "Pedagogical AI code review with knowledge tracing." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="container mx-auto px-6 pt-24 pb-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-mono text-muted-foreground mb-8">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              AI that teaches, not just corrects
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05]">
              The AI code reviewer<br />built for <span className="text-primary">CS students</span>.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Copilot writes code for you. CodeWise teaches you why your code is wrong —
              maps every mistake to the underlying CS concept, and tracks your mastery as you grow.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90 transition glow-cyan"
              >
                Start reviewing free <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 font-medium hover:bg-card transition"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-4 text-xs font-mono text-muted-foreground">10 reviews / month free · No credit card</p>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="container mx-auto px-6 py-24 border-b border-border">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-widest mb-3">The problem</p>
            <h2 className="text-3xl font-bold tracking-tight mb-4">Test cases tell you <em className="italic">what</em> failed. Not <em className="italic">why</em>.</h2>
            <p className="text-muted-foreground leading-relaxed">
              Students get feedback from three places: pass/fail test runners, slow instructor reviews,
              and inconsistent peer feedback. None diagnose the missing concept behind the bug.
            </p>
          </div>
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-widest mb-3">The fix</p>
            <h2 className="text-3xl font-bold tracking-tight mb-4">CodeWise diagnoses concepts, not just code.</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every issue is mapped to one of 20+ DSA concepts — arrays, recursion, DP, graphs, complexity —
              with a teaching explanation and a fix hint. Your mastery score updates after every review.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-24 border-b border-border">
        <h2 className="text-4xl font-bold tracking-tight mb-12 max-w-2xl">Three things that make CodeWise different.</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Feature
            icon={<Brain className="size-5" />}
            title="Pedagogical reviews"
            body="Prompts engineered to explain the why behind every suggestion — not just point at the bug."
          />
          <Feature
            icon={<TrendingUp className="size-5" />}
            title="Knowledge tracing"
            body="Bayesian-style mastery model updates after each review across 20+ DSA topics."
          />
          <Feature
            icon={<Target className="size-5" />}
            title="Personalized practice"
            body="Auto-generated problems calibrated to your weakest topic — in your zone of proximal development."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6 py-24 border-b border-border">
        <h2 className="text-4xl font-bold tracking-tight mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", icon: <Code2 className="size-4" />, t: "Paste your code", d: "Python, JavaScript, Java, or C++ — any snippet from your DSA practice." },
            { n: "02", icon: <Sparkles className="size-4" />, t: "Get a concept review", d: "Line-by-line issues tagged with the concept they reveal, with fix hints." },
            { n: "03", icon: <Zap className="size-4" />, t: "Practice the gap", d: "Generate a problem targeting your weakest topic. Loop until mastered." },
          ].map((s) => (
            <div key={s.n} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
                <span className="text-primary">{s.icon}</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">{s.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-32">
        <div className="rounded-2xl border border-border bg-card p-12 md:p-16 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to level up your CS fundamentals?</h2>
          <p className="text-muted-foreground mb-8">Free forever for 10 reviews/month. No card required.</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90 transition glow-cyan"
          >
            Create your account <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container mx-auto px-6 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-mono">CodeWise · for CS students</span>
          <span className="font-mono text-xs">Built on Lovable</span>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-bold tracking-tight text-lg flex items-center gap-2">
          <span className="size-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-mono">{"</>"}</span>
          CodeWise
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/login" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition">Sign in</Link>
          <Link to="/signup" className="ml-2 px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition">
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 hover:border-primary/40 transition">
      <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
