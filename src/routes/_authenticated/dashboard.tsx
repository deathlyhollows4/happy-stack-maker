import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, lazy, useState, useEffect } from "react";
import { getDashboard, seedFSRSTestData } from "@/lib/codewise.functions";
import { Markdown } from "@/components/markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingModal } from "@/components/onboarding-modal";
import { ReviewQueue } from "@/components/review-queue";
import { ArrowUpRight, Code2, ChevronDown } from "lucide-react";

const KnowledgeGraph = lazy(() =>
  import("@/components/knowledge-graph").then((m) => ({ default: m.KnowledgeGraph })),
);

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | CodeWise" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const seedFn = useServerFn(seedFSRSTestData);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const reviews = data?.submissions ?? [];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  useEffect(() => {
    if (!data) return;
    if (reviews.length > 0) return;
    if (localStorage.getItem("onboarding_dismissed") === "true") return;
    setShowOnboarding(true);
  }, [data, reviews.length]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Your workspace
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Track your DSA topic progress.</p>
        </div>
        <Link
          to="/review"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <Code2 className="size-4" /> New review
        </Link>
        <button
          onClick={() => seedFn()}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-card transition"
        >
          Seed
        </button>
      </div>

      {isLoading && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="lg:col-span-3 h-[440px] rounded-lg" />
          <Skeleton className="lg:col-span-2 h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="lg:col-span-3 h-20 rounded-lg" />
        </div>
      )}

      {data && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Stat label="Total reviews" value={reviews.length} />
          <Stat label="Topics touched" value={data.progress.length} />
          <Stat
            label="Avg mastery"
            value={
              data.progress.length
                ? `${Math.round((data.progress.reduce((a, p) => a + p.mastery, 0) / data.progress.length) * 100)}%`
                : "-"
            }
          />

          <section className="lg:col-span-3 rounded-lg border border-border bg-card p-6 overflow-hidden">
            <h2 className="font-display text-2xl mb-1">Knowledge graph</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Prerequisites and your mastery across 20 CS topics. Hover to inspect. Drag to pan,
              scroll to zoom.
            </p>
            <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
              <KnowledgeGraph topics={data.topics} progress={data.progress} />
            </Suspense>
          </section>

          <section className="lg:col-span-3">
            <ReviewQueue topics={data.topics} />
          </section>

          <section className="lg:col-span-2 rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-2xl mb-4">Topic mastery</h2>
            {data.progress.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Submit your first review to start tracking mastery.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.progress
                  .map((p) => ({ ...p, topic: data.topics.find((t) => t.slug === p.topic_slug) }))
                  .sort((a, b) => a.mastery - b.mastery)
                  .map((p) => (
                    <li key={p.topic_slug}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{p.topic?.name ?? p.topic_slug}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {Math.round(p.mastery * 100)}% · {p.attempts} attempts
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${p.mastery * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-display text-2xl mb-4">Recent reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <ul className="space-y-3">
                {visibleReviews.map((s) => (
                  <li
                    key={s.id}
                    className="text-sm border-b border-border last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                        {s.language}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="line-clamp-2">
                      <Markdown className="text-muted-foreground">
                        {s.summary ?? "No summary"}
                      </Markdown>
                    </div>
                    <Link
                      to="/submission/$submissionId"
                      params={{ submissionId: s.id }}
                      className="text-xs text-accent hover:underline mt-1 inline-block"
                    >
                      View details →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {reviews.length > 5 && (
              <button
                onClick={() => setShowAllReviews((v) => !v)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground py-2 rounded-md hover:bg-accent/5 transition-colors"
              >
                {showAllReviews ? `Show fewer` : `View all ${reviews.length} reviews`}
                <ChevronDown
                  className={`size-4 transition-transform ${showAllReviews ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </section>

          <section className="lg:col-span-3 rounded-lg border border-border bg-card p-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl mb-1">Practice</h2>
              <p className="text-sm text-muted-foreground">
                Generate a practice problem for your weakest topic.
              </p>
            </div>
            <Link
              to="/practice"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              Go to Practice <ArrowUpRight className="size-4" />
            </Link>
          </section>
        </div>
      )}

      <OnboardingModal open={showOnboarding} onDismiss={() => setShowOnboarding(false)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-4xl mt-2">{value}</p>
    </div>
  );
}
