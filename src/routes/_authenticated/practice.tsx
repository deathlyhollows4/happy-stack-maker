import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { generatePractice, listPractice } from "@/lib/codewise.functions";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({ meta: [{ title: "Practice — CodeWise" }] }),
  component: Practice,
});

function Practice() {
  const gen = useServerFn(generatePractice);
  const list = useServerFn(listPractice);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["practice"], queryFn: () => list() });
  const [busy, setBusy] = useState(false);

  const onGen = async () => {
    setBusy(true);
    try {
      const r = await gen({ data: { language: "python" } });
      if (!r.ok) toast.error(r.error);
      else { toast.success("New problem ready"); refetch(); }
    } finally { setBusy(false); }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice</h1>
          <p className="text-muted-foreground mt-1">Auto-generated problems targeting your weakest topic.</p>
        </div>
        <button onClick={onGen} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
          <Sparkles className="size-4" /> {busy ? "Generating…" : "Generate a problem"}
        </button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {data && data.problems.length === 0 && (
        <p className="text-sm text-muted-foreground">No problems yet. Click "Generate a problem" to get one.</p>
      )}

      <div className="space-y-4">
        {data?.problems.map((p: any) => (
          <article key={p.id} className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold tracking-tight">{p.title}</h2>
              {p.topic_slug && <span className="text-xs font-mono px-2 py-1 rounded bg-primary/10 text-primary">{p.topic_slug}</span>}
            </div>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">{p.prompt}</pre>
            {p.starter_code && (
              <div className="mt-4">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Starter ({p.language})</p>
                <pre className="rounded-md bg-background border border-border p-3 text-xs overflow-auto font-mono">{p.starter_code}</pre>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
