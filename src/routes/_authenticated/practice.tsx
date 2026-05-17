import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { generatePractice, listPractice, reviewCode } from "@/lib/codewise.functions";
import { runCode } from "@/lib/code-exec.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Play, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({ meta: [{ title: "Practice. CodeWise" }] }),
  component: Practice,
});

type Lang = "python" | "javascript" | "java" | "cpp";
function langExt(l: Lang) {
  return l === "python"
    ? python()
    : l === "javascript"
      ? javascript()
      : l === "java"
        ? java()
        : cpp();
}

function Practice() {
  const gen = useServerFn(generatePractice);
  const list = useServerFn(listPractice);
  const { data, refetch, isLoading } = useQuery({ queryKey: ["practice"], queryFn: () => list() });
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = data?.problems.find((p: any) => p.id === activeId) ?? null;

  useEffect(() => {
    if (!activeId && data?.problems?.[0]) setActiveId(data.problems[0].id);
  }, [data, activeId]);

  const onGen = async () => {
    setBusy(true);
    try {
      const r = await gen({ data: { language: "python", environment: getPaddleEnvironment() } });
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("New problem ready");
        await refetch();
        setActiveId((r as any).problem?.id ?? null);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3.5" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Targeted reps
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Practice</h1>
          <p className="text-muted-foreground mt-2">
            Auto-generated problems targeting your weakest topic.
          </p>
        </div>
        <button
          onClick={onGen}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Sparkles className="size-4" /> {busy ? "Generating…" : "Generate a problem"}
        </button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {data && data.problems.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No problems yet. Click "Generate a problem" to get one.
        </p>
      )}

      {data && data.problems.length > 0 && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <aside className="space-y-2">
            {data.problems.map((p: any) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`w-full text-left rounded-md border p-3 transition ${
                  activeId === p.id
                    ? "border-accent bg-accent/10"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <div className="text-sm font-medium truncate">{p.title}</div>
                {p.topic_slug && (
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {p.topic_slug}
                  </div>
                )}
              </button>
            ))}
          </aside>

          {active ? <ProblemWorkspace problem={active} /> : null}
        </div>
      )}
    </div>
  );
}

function ProblemWorkspace({ problem }: { problem: any }) {
  const lang = (problem.language as Lang) ?? "python";
  const nav = useNavigate();
  const [code, setCode] = useState<string>(problem.starter_code || "");
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [output, setOutput] = useState<{ stdout: string; stderr: string; exit: number } | null>(
    null,
  );

  const runFn = useServerFn(runCode);
  const reviewFn = useServerFn(reviewCode);

  useEffect(() => {
    setCode(problem.starter_code || "");
    setOutput(null);
  }, [problem.id]);

  const onRun = async () => {
    if (!code.trim()) {
      toast.error("Write some code first.");
      return;
    }
    setRunning(true);
    setOutput(null);
    try {
      const r = await runFn({ data: { code, language: lang, stdin, environment: getPaddleEnvironment() } });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setOutput({
        stdout: r.stdout || r.compileStderr || "",
        stderr: r.stderr || "",
        exit: r.exitCode ?? 0,
      });
    } finally {
      setRunning(false);
    }
  };

  const onSubmit = async () => {
    setReviewing(true);
    try {
      const r = await reviewFn({ data: { code, language: lang, environment: getPaddleEnvironment() } });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Review complete");
      nav({ to: "/submission/$submissionId", params: { submissionId: r.submissionId! } });
    } finally {
      setReviewing(false);
    }
  };

  return (
    <article className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-display text-2xl mb-1">{problem.title}</h2>
        {problem.topic_slug && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-accent/15 text-accent">
            {problem.topic_slug}
          </span>
        )}
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans mt-4">
          {problem.prompt}
        </pre>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border flex items-center justify-between">
          <span>Editor · {lang}</span>
          <div className="flex gap-2">
            <button
              onClick={onRun}
              disabled={running || reviewing}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/10 disabled:opacity-50"
            >
              <Play className="size-3.5" /> {running ? "Running…" : "Run"}
            </button>
            <button
              onClick={onSubmit}
              disabled={running || reviewing}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="size-3.5" /> {reviewing ? "Reviewing…" : "Submit for AI review"}
            </button>
          </div>
        </div>
        <CodeMirror
          value={code}
          onChange={setCode}
          extensions={[langExt(lang)]}
          theme={oneDark}
          height="42vh"
          basicSetup={{ lineNumbers: true, foldGutter: true }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Stdin (optional)
          </label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-md border border-border bg-input p-2 text-xs font-mono"
            placeholder="Lines passed to your program's standard input"
          />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Output
            </span>
            {output && (
              <span
                className={`text-[10px] font-mono ${output.exit === 0 ? "text-success" : "text-destructive"}`}
              >
                exit {output.exit}
              </span>
            )}
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap min-h-[80px]">
            {!output && !running && (
              <span className="text-muted-foreground">Run your code to see output.</span>
            )}
            {running && <span className="text-muted-foreground animate-pulse">Executing…</span>}
            {output?.stdout && <span>{output.stdout}</span>}
            {output?.stderr && <span className="text-destructive">{output.stderr}</span>}
          </pre>
        </div>
      </div>
    </article>
  );
}
