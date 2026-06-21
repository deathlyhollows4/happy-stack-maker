import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { exportResearchData } from "@/lib/codewise.functions";
import { requireAdminRoute } from "@/lib/admin-route";
import { ArrowLeft, Download, BarChart3, Activity, Code, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/research")({
  head: () => ({ meta: [{ title: "Research Data | CodeWise" }] }),
  beforeLoad: requireAdminRoute,
  component: AdminResearchPage,
});

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function AdminResearchPage() {
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportFn = useServerFn(exportResearchData);

  const fetchData = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await exportFn();
      if (!r.ok) {
        setError(r.error ?? "Forbidden");
        return;
      }
      setResult(r);
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch data");
    } finally {
      setBusy(false);
    }
  };

  const downloadCSV = () => {
    if (!result?.events?.length) return;
    const header = "event_type,created_at\n";
    const rows = result.events.map((e: any) => `"${e.event_type}","${e.created_at}"`).join("\n");
    downloadBlob(header + rows, "codewise-research-events.csv", "text/csv");
  };

  const downloadJSON = () => {
    if (!result) return;
    downloadBlob(
      JSON.stringify(
        {
          total_events: result.total_events,
          event_counts: result.event_counts,
          language_breakdown: result.language_breakdown,
          concept_distribution: result.concept_distribution,
          severity_distribution: result.severity_distribution,
          events: result.events,
        },
        null,
        2,
      ),
      "codewise-research-data.json",
      "application/json",
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3.5" /> Back to Admin Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Admin. ICNDIA-2027
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Research Data</h1>
          <p className="text-muted-foreground mt-2">
            Anonymized telemetry for the academic paper. No PII is included in exports.
          </p>
        </div>
      </div>

      {!result && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <BarChart3 className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            Fetch anonymized research data to preview summary stats before exporting.
          </p>
          <button
            onClick={fetchData}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="size-4" /> {busy ? "Loading…" : "Fetch Research Data"}
          </button>
          {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Activity} label="Total Events" value={result.total_events} />
            <StatCard
              icon={BarChart3}
              label="Event Types"
              value={Object.keys(result.event_counts ?? {}).length}
            />
            <StatCard
              icon={Code}
              label="Languages"
              value={Object.keys(result.language_breakdown ?? {}).length}
            />
            <StatCard
              icon={AlertTriangle}
              label="Severity Levels"
              value={Object.keys(result.severity_distribution ?? {}).length}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <BreakdownCard title="Event Type Breakdown" data={result.event_counts ?? {}} />
            <BreakdownCard title="Language Breakdown" data={result.language_breakdown ?? {}} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <BreakdownCard
              title="Severity Distribution"
              data={result.severity_distribution ?? {}}
            />
            <BreakdownCard
              title="Concept Count Distribution"
              data={result.concept_distribution ?? {}}
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-display text-lg mb-4">Export</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Export anonymized data for the ICNDIA-2027 paper. No user IDs, emails, or personal
              data are included.
            </p>
            <div className="flex gap-3">
              <button
                onClick={downloadCSV}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent/10"
              >
                <Download className="size-4" /> Download CSV ({(result.events ?? []).length} events)
              </button>
              <button
                onClick={downloadJSON}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent/10"
              >
                <Download className="size-4" /> Download JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-display">{value}</p>
    </div>
  );
}

function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-display text-lg mb-3">{title}</h3>
      {entries.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
      <div className="space-y-2 max-h-[300px] overflow-auto">
        {entries.map(([key, count]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="font-mono text-xs">{key}</span>
            <span className="text-muted-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
