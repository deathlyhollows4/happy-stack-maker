import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { exportUserData } from "@/lib/codewise.functions";
import { FileJson, FileSpreadsheet, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings/export")({
  head: () => ({ meta: [{ title: "Export Data | CodeWise" }] }),
  component: ExportPage,
});

type CsvRow = Record<string, unknown>;
type SubmissionPreviewRow = {
  id: string;
  language: string;
  code: string;
  concepts?: string[] | null;
  created_at: string;
};

function toCSV(rows: CsvRow[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]!);
  const header = keys.join(",");
  const body = rows
    .map((row) =>
      keys
        .map((k) => {
          const v = row[k];
          if (v === null || v === undefined) return "";
          const s = typeof v === "string" ? v : JSON.stringify(v);
          if (s.includes(",") || s.includes('"') || s.includes("\n")) {
            return `"${s.replace(/"/g, '""')}"`;
          }
          return s;
        })
        .join(","),
    )
    .join("\n");
  return header + "\n" + body;
}

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

function ExportPage() {
  const fn = useServerFn(exportUserData);
  const { data, isLoading, error } = useQuery({
    queryKey: ["exportUserData"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-destructive">Failed to load export data. Please try again.</p>
        </div>
      </div>
    );
  }

  const d = data!;
  const counts = {
    submissions: d.submissions.length,
    issues: d.review_issues.length,
    progress: d.progress.length,
    practice: d.practice_problems.length,
    attempts: d.practice_attempts.length,
    events: d.practice_events.length,
  };

  const handleDownloadJSON = () => {
    const json = JSON.stringify(data, null, 2);
    downloadBlob(
      json,
      `codewise-export-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
  };

  const handleDownloadCSV = () => {
    const zipParts: string[] = [];
    if (d.submissions.length > 0) {
      zipParts.push("# Submissions\n" + toCSV(d.submissions));
    }
    if (d.review_issues.length > 0) {
      zipParts.push((zipParts.length ? "\n\n" : "") + "# Review Issues\n" + toCSV(d.review_issues));
    }
    if (d.progress.length > 0) {
      zipParts.push((zipParts.length ? "\n\n" : "") + "# Progress\n" + toCSV(d.progress));
    }
    if (d.practice_problems.length > 0) {
      zipParts.push(
        (zipParts.length ? "\n\n" : "") + "# Practice Problems\n" + toCSV(d.practice_problems),
      );
    }
    if (d.practice_attempts.length > 0) {
      zipParts.push(
        (zipParts.length ? "\n\n" : "") + "# Practice Attempts\n" + toCSV(d.practice_attempts),
      );
    }
    if (d.practice_events.length > 0) {
      zipParts.push(
        (zipParts.length ? "\n\n" : "") + "# Practice Events\n" + toCSV(d.practice_events),
      );
    }
    downloadBlob(
      zipParts.join("\n\n"),
      `codewise-export-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv",
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight">Export your data</h1>
      <p className="text-muted-foreground mt-2">
        Download your submissions, reviews, mastery progress, practice problems, attempts, and
        practice activity logs.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Submissions" value={counts.submissions} />
        <StatCard label="Review issues" value={counts.issues} />
        <StatCard label="Progress rows" value={counts.progress} />
        <StatCard label="Practice problems" value={counts.practice} />
        <StatCard label="Practice attempts" value={counts.attempts} />
        <StatCard label="Activity logs" value={counts.events} />
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <button
          onClick={handleDownloadJSON}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <FileJson className="size-4" /> Download JSON
        </button>
        <button
          onClick={handleDownloadCSV}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition"
        >
          <FileSpreadsheet className="size-4" /> Download CSV
        </button>
      </div>

      {counts.submissions === 0 &&
        counts.progress === 0 &&
        counts.practice === 0 &&
        counts.attempts === 0 &&
        counts.events === 0 && (
          <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
            <Download className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              No data to export yet. Submit a code review or generate a practice problem to get
              started.
            </p>
          </div>
        )}

      {counts.submissions > 0 && (
        <div className="mt-8 rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Submissions preview
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                    Language
                  </th>
                  <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                    Code
                  </th>
                  <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                    Concepts
                  </th>
                  <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.submissions.slice(0, 10).map((s: SubmissionPreviewRow) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-2 font-mono text-xs">{s.language}</td>
                    <td className="px-5 py-2 font-mono text-xs max-w-xs truncate">
                      {s.code.slice(0, 80)}
                      {s.code.length > 80 ? "…" : ""}
                    </td>
                    <td className="px-5 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(s.concepts ?? []).map((c: string) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 rounded-sm bg-accent/15 text-accent text-[11px] font-mono"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-2 font-mono text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {d.submissions.length > 10 && (
            <div className="px-5 py-2 text-xs text-muted-foreground border-t border-border">
              + {d.submissions.length - 10} more rows in export
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}
