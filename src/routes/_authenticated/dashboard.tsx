import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/codewise.functions";
import { ArrowUpRight, Code2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CodeWise" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your CS mastery, at a glance.</p>
        </div>
        <Link to="/review" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
          <Code2 className="size-4" /> New review
        </Link>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Stat label="Total reviews" value={data.submissions.length} />
          <Stat label="Topics touched" value={data.progress.length} />
          <Stat
            label="Avg mastery"
            value={data.progress.length ? `${Math.round((data.progress.reduce((a, p) => a + p.mastery, 0) / data.progress.length) * 100)}%` : "—"}
          />

          <section className="lg:col-span-2 rounded-lg border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Topic mastery</h2>
            {data.progress.length === 0 ? (
              <p className="text-sm text-muted-foreground">Submit your first review to start tracking mastery.</p>
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
                        <div className="h-full bg-primary transition-all" style={{ width: `${p.mastery * 100}%` }} />
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-6">
            <h2 className="font-semibold mb-4">Recent reviews</h2>
            {data.submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.submissions.map((s) => (
                  <li key={s.id} className="text-sm border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-primary uppercase">{s.language}</span>
                      <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{s.summary ?? "No summary"}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="lg:col-span-3 rounded-lg border border-border bg-card p-6 flex items-center justify-between">
            <div>
              <h2 className="font-semibold mb-1">Need a target?</h2>
              <p className="text-sm text-muted-foreground">Generate a practice problem for your weakest topic.</p>
            </div>
            <Link to="/practice" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              Go to Practice <ArrowUpRight className="size-4" />
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
