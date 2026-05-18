import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { getSubmission } from "@/lib/codewise.functions";
import { Markdown } from "@/components/markdown";
import { toast } from "sonner";
import { ArrowLeft, Share2, AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/submission/$submissionId")({
  head: ({ params }) => ({
    meta: [
      { title: "Submission Detail | CodeWise" },
      {
        property: "og:image",
        content: `https://happy-stack-maker.lovable.app/api/public/og/${params.submissionId}`,
      },
    ],
  }),
  component: SubmissionDetail,
});

type Lang = "python" | "javascript" | "java" | "cpp";
const LANG_LABELS: Record<Lang, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
};

function langExt(l: Lang) {
  return l === "python"
    ? python()
    : l === "javascript"
      ? javascript()
      : l === "java"
        ? java()
        : cpp();
}

function SubmissionDetail() {
  const { submissionId } = useParams({ from: "/_authenticated/submission/$submissionId" });
  const fn = useServerFn(getSubmission);
  const { data, isLoading, error } = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => fn({ data: { id: submissionId } }),
    enabled: !!submissionId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const submission = data?.submission ?? null;
  const issues = data?.issues ?? [];
  const lang = (submission?.language as Lang) ?? "python";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Workspace
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Submission Detail</h1>
          <p className="text-muted-foreground mt-2">
            {submission
              ? `${LANG_LABELS[lang]} · ${new Date(submission.created_at).toLocaleDateString()}`
              : "Viewing your code and review results."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/s/${submissionId}`;
              navigator.clipboard.writeText(url).then(
                () => toast.success("Share link copied!"),
                () => toast.error("Failed to copy link"),
              );
            }}
            className="inline-flex items-center gap-2 rounded-md bg-accent/15 text-accent px-4 py-2 text-sm font-medium hover:bg-accent/25 transition"
          >
            <Share2 className="size-4" /> Share Results
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card transition"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="rounded-lg min-h-[60vh]" />
          <Skeleton className="rounded-lg min-h-[60vh]" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-destructive">Failed to load submission.</p>
        </div>
      )}

      {!isLoading && !error && !submission && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Submission not found.</p>
        </div>
      )}

      {!isLoading && !error && submission && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border">
              {LANG_LABELS[lang]}
            </div>
            <CodeMirror
              value={submission.code}
              extensions={[langExt(lang)]}
              theme={oneDark}
              height="60vh"
              editable={false}
              basicSetup={{ lineNumbers: true, foldGutter: true }}
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-6 min-h-[60vh] overflow-auto">
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-2xl mb-2">Summary</h3>
                <Markdown className="text-muted-foreground">
                  {submission.summary ?? "No summary available."}
                </Markdown>
              </div>
              {submission.concepts && submission.concepts.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Concepts touched
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {submission.concepts.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-1 rounded-sm bg-accent/15 text-accent text-[11px] font-mono"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Issues ({issues.length})
                </h4>
                {issues.length === 0 ? (
                  <p className="text-sm text-success flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> No issues found. Nice work.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {issues.map((it) => (
                      <IssueCard key={it.id} issue={it} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IssueCard({ issue }: { issue: any }) {
  const Icon =
    issue.severity === "error" ? AlertCircle : issue.severity === "warning" ? AlertTriangle : Info;
  const color =
    issue.severity === "error"
      ? "text-destructive"
      : issue.severity === "warning"
        ? "text-warning"
        : "text-accent";
  return (
    <li className="rounded-md border border-border p-4">
      <div className="flex items-start gap-3">
        <Icon className={`size-4 mt-0.5 ${color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium">{issue.title}</span>
            {issue.line != null && (
              <span className="text-xs font-mono text-muted-foreground">line {issue.line}</span>
            )}
            {issue.concept_slug && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-sm bg-accent/15 text-accent">
                {issue.concept_slug}
              </span>
            )}
          </div>
          <Markdown className="text-muted-foreground">{issue.explanation}</Markdown>
          {issue.fix_hint && (
            <div className="mt-2 text-sm border-l-2 border-accent/50 pl-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent mr-2">
                fix
              </span>
              <Markdown className="text-foreground/90 mt-1">{issue.fix_hint}</Markdown>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
