import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { exportAllUserData } from "@/lib/codewise.functions";
import { Shield, Loader2, FileJson, FileSpreadsheet, Database } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/export")({
  head: () => ({ meta: [{ title: "Export All Data | CodeWise" }] }),
  component: AdminExport,
});

function toCSV(rows: Record<string, any>[]): string {
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

function AdminExport() {
  const fn = useServerFn(exportAllUserData);
  const { data, isLoading, error } = useQuery({
    queryKey: ["adminExport"],
    queryFn: () => fn(),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.ok) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Shield className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl">Access denied</h2>
          <p className="mt-2 text-muted-foreground">Admin privileges required.</p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const d = data.data!;
  const counts = {
    submissions: d.submissions.length,
    issues: d.review_issues.length,
    progress: d.progress.length,
    practice: d.practice_problems.length,
  };

  const totalUsers = new Set([
    ...d.submissions.map((s: any) => s.user_id),
    ...d.review_issues.map((i: any) => i.user_id),
    ...d.progress.map((p: any) => p.user_id),
    ...d.practice_problems.map((p: any) => p.user_id),
  ]).size;

  const handleDownloadJSON = () => {
    const json = JSON.stringify(data.data, null, 2);
    downloadBlob(
      json,
      `codewise-admin-export-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
  };

  const handleDownloadCSV = () => {
    const parts: string[] = [];
    if (d.submissions.length > 0)
      parts.push("# Submissions\n" + toCSV(d.submissions));
    if (d.review_issues.length > 0)
      parts.push((parts.length ? "\n\n" : "") + "# Review Issues\n" + toCSV(d.review_issues));
    if (d.progress.length > 0)
      parts.push((parts.length ? "\n\n" : "") + "# Progress\n" + toCSV(d.progress));
    if (d.practice_problems.length > 0)
      parts.push((parts.length ? "\n\n" : "") + "# Practice Problems\n" + toCSV(d.practice_problems));
    downloadBlob(
      parts.join("\n\n"),
      `codewise-admin-export-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv",
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Shield className="size-3" /> Admin
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Export All Data</h1>
          <p className="text-muted-foreground mt-2">
            Download all user submissions, reviews, progress, and practice problems across the
            entire platform.
          </p>
        </div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
        >
          Back to admin dashboard
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-10">
        <StatCard icon={<Database className="size-4" />} label="Users" value={totalUsers} />
        <StatCard icon={<Database className="size-4" />} label="Submissions" value={counts.submissions} />
        <StatCard icon={<Database className="size-4" />} label="Review Issues" value={counts.issues} />
        <StatCard icon={<Database className="size-4" />} label="Progress" value={counts.progress} />
        <StatCard icon={<Database className="size-4" />} label="Practice" value={counts.practice} />
      </div>

      <div className="flex flex-wrap gap-4 mb-10">
        <button
          onClick={handleDownloadJSON}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <FileJson className="size-4" /> Download All as JSON
        </button>
        <button
          onClick={handleDownloadCSV}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition"
        >
          <FileSpreadsheet className="size-4" /> Download All as CSV
        </button>
      </div>

      {counts.submissions > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Submissions ({d.submissions.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                    User
                  </th>
                  <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                    Language
                  </th>
                  <th className="px-5 py-2 text-left font-mono text-[11px] text-muted-foreground font-normal">
                    Concepts
                  </th>
                  <th className="px-5 py-2 text-right font-mono text-[11px] text-muted-foreground font-normal">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.submissions.slice(0, 10).map((s: any) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-2 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                      {s.user_id}
                    </td>
                    <td className="px-5 py-2 font-mono text-xs">{s.language}</td>
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
                    <td className="px-5 py-2 font-mono text-xs text-muted-foreground text-right">
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}
