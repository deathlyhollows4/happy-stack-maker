import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { TOPICS, TOPIC_CATEGORIES, type TopicMeta } from "@/lib/topics";

export const Route = createFileRoute("/learn/")({
  component: LearnIndexPage,
});

function LearnIndexPage() {
  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Topic hub
          </p>
          <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Learn CS topics
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Browse the same DSA concepts CodeWise uses in reviews, practice, and mastery tracking.
          </p>
        </div>
      </section>
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="space-y-14">
            {TOPIC_CATEGORIES.map((category) => {
              const topics = TOPICS.filter((topic) => topic.category === category);
              if (topics.length === 0) return null;
              return (
                <section key={category}>
                  <h2 className="font-display text-3xl">{category}</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {topics.map((topic) => (
                      <TopicCard key={topic.slug} topic={topic} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function TopicCard({ topic }: { topic: TopicMeta }) {
  return (
    <Link
      to="/learn/$slug"
      params={{ slug: topic.slug }}
      className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl transition-colors group-hover:text-accent">
          {topic.name}
        </h3>
        <span className="rounded-sm bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {topic.maangFrequency}
        </span>
      </div>
      <p className="mt-2 min-h-16 text-sm leading-relaxed text-muted-foreground">
        {topic.description}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Quick check: {topic.quickCheck}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent">
        Learn <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
