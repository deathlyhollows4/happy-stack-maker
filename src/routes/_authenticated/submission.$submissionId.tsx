import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import CodeMirror from "@uiw/react-codemirror";
import { langExt, type Lang, LANG_LABELS } from "@/lib/codewise.editor";
import { oneDark } from "@codemirror/theme-one-dark";
import { getSubmission } from "@/lib/codewise.functions";
import { Markdown } from "@/components/markdown";
import { toast } from "sonner";
import { ArrowLeft, Share2, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CONCEPT_NAMES: Record<string, string> = {
  arrays: "Arrays",
  strings: "Strings",
  hashing: "Hashing",
  "linked-lists": "Linked Lists",
  stacks: "Stacks",
  queues: "Queues",
  trees: "Trees",
  bst: "BST",
  heaps: "Heaps",
  graphs: "Graphs",
  "two-pointers": "Two Pointers",
  "sliding-window": "Sliding Window",
  "binary-search": "Binary Search",
  sorting: "Sorting",
  recursion: "Recursion",
  backtracking: "Backtracking",
  dp: "Dynamic Programming",
  greedy: "Greedy",
  "bit-manipulation": "Bit Manipulation",
  complexity: "Complexity Analysis",
};

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
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 md:mb-8 gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Workspace
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-5xl tracking-tight">Submission Detail</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {submission
              ? `${LANG_LABELS[lang]} - ${new Date(submission.created_at).toLocaleDateString()}`
              : "Viewing your code and review results."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/s/${submissionId}`;
              navigator.clipboard.writeText(url).then(
                () => toast.success("Share link copied!"),
                () => toast.error("Failed to copy link"),
              );
            }}
            className="inline-flex items-center justify-center gap-1.5 md:gap-2 rounded-md bg-accent/15 text-accent px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium hover:bg-accent/25 transition"
          >
            <Share2 className="size-3.5 md:size-4" /> Share Results
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 md:gap-2 rounded-md border border-border px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-foreground hover:bg-card transition"
          >
            <ArrowLeft className="size-3.5 md:size-4" /> Back to Dashboard
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <Skeleton className="rounded-lg min-h-[40vh] md:min-h-[60vh]" />
          <Skeleton className="rounded-lg min-h-[40vh] md:min-h-[60vh]" />
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
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border">
              {LANG_LABELS[lang]}
            </div>
            <CodeMirror
              value={submission.code}
              extensions={[langExt(lang)]}
              theme={oneDark}
              height="clamp(40vh, 60vw, 60vh)"
              editable={false}
              basicSetup={{ lineNumbers: true, foldGutter: true }}
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-4 md:p-6 min-h-[40vh] md:min-h-[60vh] overflow-auto">
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-xl md:text-2xl mb-2">Summary</h3>
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
                <div className="mb-3 flex items-center gap-2">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Review feedback
                  </h4>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {issues.length}
                  </span>
                </div>
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
              <WhatsNext issues={issues} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsNext({ issues }: { issues: any[] }) {
  const weakConcepts = Array.from(
    new Set(
      issues
        .filter((issue) => issue.severity === "error" && issue.concept_slug)
        .map((issue) => issue.concept_slug as string),
    ),
  );
  const firstConcept = weakConcepts[0] ?? null;

  const hasWeakConcepts = weakConcepts.length > 0;

  return (
    <section
      className={`rounded-lg border p-4 md:p-5 ${
        hasWeakConcepts ? "border-amber-500/20 bg-amber-50/10" : "border-emerald-500/20 bg-emerald-50/10"
      }`}
    >
      <h4 className={`font-display text-xl md:text-2xl mb-2 ${hasWeakConcepts ? "text-amber-500" : "text-emerald-500"}`}>
        What's next?
      </h4>
      {hasWeakConcepts ? (
        <>
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-500 mb-2">
            Weak concepts found
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {weakConcepts.map((slug) => (
              <span
                key={slug}
                className="px-2 py-1 rounded-sm bg-background/70 text-amber-500 text-[11px] font-mono"
              >
                {conceptName(slug)}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
            {weakConcepts.map((slug) => (
              <Link
                key={slug}
                to="/learn/$slug"
                params={{ slug }}
                className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium hover:border-accent/60 transition"
              >
                Learn {conceptName(slug)}
              </Link>
            ))}
            {firstConcept && (
              <Link
                to="/practice"
                search={{ topic: firstConcept }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                Practice these concepts
              </Link>
            )}
            <Link
              to="/review"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium hover:border-accent/60 transition"
            >
              Review another solution
            </Link>
          </div>
        </>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-emerald-500">
            <CheckCircle2 className="size-4" /> No weak concepts found. Great work!
          </p>
          <Link
            to="/review"
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Review another solution
          </Link>
        </div>
      )}
    </section>
  );
}

function conceptName(slug: string) {
  return CONCEPT_NAMES[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function IssueCard({ issue }: { issue: any }) {
  const isError = issue.severity === "error";
  const isWarning = issue.severity === "warning";
  const Icon = isError ? AlertCircle : isWarning ? AlertTriangle : CheckCircle2;
  const tone = isError
    ? "border-red-500/20 bg-red-50/10 text-red-500"
    : isWarning
      ? "border-amber-500/20 bg-amber-50/10 text-amber-500"
      : "border-emerald-500/20 bg-emerald-50/10 text-emerald-500";
  return (
    <li className={`rounded-md border p-3 md:p-4 ${tone}`}>
      <div className="flex items-start gap-3">
        <Icon className="size-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium">{issue.title}</span>
            {issue.line != null && (
              <span className="text-xs font-mono text-muted-foreground">line {issue.line}</span>
            )}
            {!isError && !isWarning && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-500">
                Validated
              </span>
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
