import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getDueReviews } from "@/lib/codewise.functions";
import { ArrowUpRight, Clock, TrendingUp } from "lucide-react";

interface TopicInfo {
  slug: string;
  name: string;
}

interface DueReview {
  topic_slug: string;
  retrievability: number;
  next_review_date: string;
  difficulty: number;
  stability: number;
}

function topicName(slug: string, topics: TopicInfo[]): string {
  return topics.find((t) => t.slug === slug)?.name ?? slug;
}

function urgencyLabel(date: string): {
  label: string;
  variant: "red" | "amber" | "green";
} {
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHours = diffMs / 3600000;

  if (diffMs <= 0)
    return { label: `Due ${Math.round(Math.abs(diffHours))}h ago`, variant: "red" };
  if (diffHours <= 24) return { label: `Due in ${Math.round(diffHours)}h`, variant: "amber" };
  return { label: `Due in ${Math.round(diffHours / 24)}d`, variant: "green" };
}

function difficultyStars(difficulty: number): string {
  const filled = Math.round(difficulty / 2);
  return "★".repeat(Math.max(1, filled)) + "☆".repeat(Math.max(0, 5 - filled));
}

function borderColor(variant: "red" | "amber" | "green"): string {
  if (variant === "red") return "border-red-500/40";
  if (variant === "amber") return "border-amber-500/40";
  return "border-green-500/40";
}

export function ReviewQueue({ topics }: { topics: TopicInfo[] }) {
  const fn = useServerFn(getDueReviews);
  const { data: due, isLoading } = useQuery({
    queryKey: ["dueReviews"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading) return null;
  if (!due || due.length === 0) {
    const daysUntil = "Check back soon";
    return (
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-2xl mb-1">Review Queue</h2>
        <p className="text-sm text-muted-foreground">
          All topics mastered. {daysUntil}.
        </p>
      </section>
    );
  }

  const items = due as DueReview[];

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="font-display text-2xl mb-1">Review Queue</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Topics due for review, scheduled by spaced repetition.
      </p>
      <div className="space-y-3">
        {items.map((item) => {
          const urgency = urgencyLabel(item.next_review_date);
          return (
            <div
              key={item.topic_slug}
              className={`flex items-center justify-between rounded-lg border ${borderColor(urgency.variant)} bg-background px-4 py-3`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {topicName(item.topic_slug, topics)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`flex items-center gap-1 font-mono text-xs ${
                    urgency.variant === "red" ? "text-red-500" :
                    urgency.variant === "amber" ? "text-amber-500" : "text-green-500"
                  }`}>
                    <Clock className="size-3" />
                    {urgency.label}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <TrendingUp className="size-3" />
                    {Math.round(item.retrievability * 100)}% recall
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {difficultyStars(item.difficulty)}
                  </span>
                </div>
              </div>
              <Link
                to="/practice"
                search={{ topic: item.topic_slug }}
                className="shrink-0 ml-3 inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                Solve <ArrowUpRight className="size-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
