import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { getPublicSubmission } from "@/lib/codewise.functions";
import { Markdown } from "@/components/markdown";
import { Sparkles, AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/s/$submissionId")({
  head: ({ params }) => {
    const shortId = params.submissionId.slice(0, 8);
    const title = `Shared code review ${shortId} | CodeWise`;
    const ogTitle = `Code review ${shortId} on CodeWise`;
    const url = `https://happy-stack-maker.lovable.app/s/${params.submissionId}`;
    return {
      meta: [
        { title },
        { name: "description", content: "CS code review from CodeWise, shared by a student." },
        { property: "og:title", content: ogTitle },
        {
          property: "og:description",
          content: "Code review for CS students with concept-aware feedback.",
        },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        {
          property: "og:image",
          content: `https://happy-stack-maker.lovable.app/api/public/og/${params.submissionId}`,
        },
        {
          name: "twitter:image",
          content: `https://happy-stack-maker.lovable.app/api/public/og/${params.submissionId}`,
        },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: SharePage,
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

function SharePage() {
  const { submissionId } = useParams({ from: "/s/$submissionId" });
  const fn = useServerFn(getPublicSubmission);
  const { data, isLoading, error } = useQuery({
    queryKey: ["publicSubmission", submissionId],
    queryFn: () => fn({ data: { id: submissionId } }),
    enabled: !!submissionId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const submission = data?.submission ?? null;
  const issues = data?.issues ?? [];
  const lang = (submission?.language as Lang) ?? "python";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-lg tracking-tight">CodeWise</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent bg-accent/15 px-1.5 py-0.5 rounded-sm">
              beta
            </span>
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            <Sparkles className="size-4" /> Try CodeWise
          </Link>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Shared review
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Code Review</h1>
          <p className="text-muted-foreground mt-2">
            {submission
              ? `${LANG_LABELS[lang]} · ${new Date(submission.created_at).toLocaleDateString()}`
              : "Loading…"}
          </p>
        </div>

        {isLoading && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card min-h-[60vh] animate-pulse" />
            <div className="rounded-lg border border-border bg-card p-6 min-h-[60vh] animate-pulse" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="text-sm text-destructive">Failed to load this review.</p>
          </div>
        )}

        {!isLoading && !error && !submission && (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-lg font-medium mb-2">Review not found</p>
            <p className="text-sm text-muted-foreground mb-6">
              This submission may have been deleted or the link is incorrect.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              <Sparkles className="size-4" /> Try CodeWise
            </Link>
          </div>
        )}

        {!isLoading && !error && submission && (
          <>
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
                        {submission.concepts.map((c: string) => (
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
                        {issues.map((it: any) => (
                          <IssueCard key={it.id} issue={it} />
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
              <h2 className="font-display text-2xl mb-2">Get your own review</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                CodeWise reviews your code, mapping each issue to the CS concept behind it.
              </p>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                <Sparkles className="size-4" /> Start reviewing for free
              </Link>
            </div>
          </>
        )}
      </main>
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
