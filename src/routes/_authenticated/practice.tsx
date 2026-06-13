import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import CodeMirror from "@uiw/react-codemirror";
import { langExt, type Lang, LANG_LABELS } from "@/lib/codewise.editor";
import { editorTheme } from "@/components/codemirror-themes";
import { EditorSettingsPopover } from "@/components/editor-settings";
import { generatePractice, listPractice, reviewCode } from "@/lib/codewise.functions";
import { Markdown } from "@/components/markdown";
import { useTelemetry } from "@/hooks/use-telemetry";
import { runCode } from "@/lib/code-exec.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Play, Send, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const practiceSearchSchema = z.object({
  topic: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({ meta: [{ title: "Practice | CodeWise" }] }),
  validateSearch: (search) => practiceSearchSchema.catch({}).parse(search),
  component: Practice,
});

type TopicSlug = string;
type PracticeStep = "topic" | "language" | "solve";
interface TopicMeta {
  slug: TopicSlug;
  name: string;
  category: string;
}
const TOPIC_LIST: TopicMeta[] = [
  { slug: "arrays", name: "Arrays", category: "Data Structures" },
  { slug: "strings", name: "Strings", category: "Data Structures" },
  { slug: "hashing", name: "Hashing", category: "Data Structures" },
  { slug: "linked-lists", name: "Linked Lists", category: "Data Structures" },
  { slug: "stacks", name: "Stacks", category: "Data Structures" },
  { slug: "queues", name: "Queues", category: "Data Structures" },
  { slug: "trees", name: "Trees", category: "Data Structures" },
  { slug: "bst", name: "BST", category: "Data Structures" },
  { slug: "heaps", name: "Heaps", category: "Data Structures" },
  { slug: "graphs", name: "Graphs", category: "Data Structures" },
  { slug: "two-pointers", name: "Two Pointers", category: "Algorithms" },
  { slug: "sliding-window", name: "Sliding Window", category: "Algorithms" },
  { slug: "binary-search", name: "Binary Search", category: "Algorithms" },
  { slug: "sorting", name: "Sorting", category: "Algorithms" },
  { slug: "recursion", name: "Recursion", category: "Algorithms" },
  { slug: "backtracking", name: "Backtracking", category: "Algorithms" },
  { slug: "dp", name: "Dynamic Programming", category: "Algorithms" },
  { slug: "greedy", name: "Greedy", category: "Algorithms" },
  { slug: "bit-manipulation", name: "Bit Manipulation", category: "Algorithms" },
  { slug: "complexity", name: "Complexity Analysis", category: "Fundamentals" },
];
const TOPIC_CATEGORIES = [...new Set(TOPIC_LIST.map((t) => t.category))];

function Practice() {
  const gen = useServerFn(generatePractice);
  const list = useServerFn(listPractice);
  const { track } = useTelemetry();
  const search = Route.useSearch();
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["practice"],
    queryFn: () => list(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>("python");
  const [step, setStep] = useState<PracticeStep>("topic");
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [topicSlug, setTopicSlug] = useState<string | null>(
    search.topic && TOPIC_LIST.some((t) => t.slug === search.topic) ? search.topic : null,
  );

  const active = data?.problems.find((p: any) => p.id === activeId) ?? null;
  const selectedTopicName = topicSlug
    ? TOPIC_LIST.find((t) => t.slug === topicSlug)?.name ?? topicSlug
    : "Weakest Topic (auto)";

  useEffect(() => {
    if (!activeId && data?.problems?.[0]) setActiveId(data.problems[0].id);
  }, [data, activeId]);

  const onGen = async () => {
    setBusy(true);
    try {
      const r = await gen({
        data: { language: lang, topicSlug, environment: getPaddleEnvironment() },
      });
      if (!r.ok) {
        toast.error(r.error);
        return false;
      }
      toast.success("New problem ready");
      await refetch();
      setActiveId((r as any).problem?.id ?? null);
      setStep("solve");
      track("practice_generated", {
        topic: (r as any).problem?.topic_slug ?? null,
        language: lang,
      });
      return true;
    } catch (e: any) {
      console.error("generatePractice failed:", e);
      toast.error(e?.message || "Could not generate a problem. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const resetFlow = () => {
    setStep("topic");
    setShowAllOptions(false);
    setActiveId(null);
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
            {topicSlug
              ? `Generating problems for ${selectedTopicName}.`
              : "Auto-generated problems targeting your weakest topic."}
          </p>
        </div>
        {showAllOptions && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onGen}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Sparkles className="size-4" /> {busy ? "Generating..." : "Generate a problem"}
            </button>
            <TopicSelect topicSlug={topicSlug} onChange={setTopicSlug} />
            <LanguageSelect lang={lang} onChange={setLang} />
          </div>
        )}
      </div>

      {!showAllOptions && step === "topic" && (
        <section className="max-w-xl mx-auto rounded-lg border border-border bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Step 1 of 3</p>
          <h2 className="font-display text-3xl mt-2 mb-2">Choose topic</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Start with your weakest topic automatically, or pick a specific area.
          </p>
          <div className="rounded-md border border-accent/40 bg-accent/10 p-4 mb-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-accent">Suggested</p>
            <p className="font-medium mt-1">Weakest topic</p>
            <p className="text-sm text-muted-foreground mt-1">
              Leave the picker on auto to let CodeWise choose your lowest mastery topic.
            </p>
          </div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Topic
          </label>
          <TopicSelect topicSlug={topicSlug} onChange={setTopicSlug} className="mt-2 w-full" />
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowAllOptions(true)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Show all options
            </button>
            <button
              type="button"
              onClick={() => setStep("language")}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Next: Choose language
            </button>
          </div>
        </section>
      )}

      {!showAllOptions && step === "language" && (
        <section className="max-w-xl mx-auto rounded-lg border border-border bg-card p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Step 2 of 3</p>
          <h2 className="font-display text-3xl mt-2 mb-2">Choose language</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Topic: <span className="text-foreground">{selectedTopicName}</span>
          </p>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Language
          </label>
          <LanguageSelect lang={lang} onChange={setLang} className="mt-2 w-full" />
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep("topic")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Back to topic
            </button>
            <button
              type="button"
              onClick={onGen}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Sparkles className="size-4" /> {busy ? "Generating..." : "Generate problem"}
            </button>
          </div>
        </section>
      )}

      {(showAllOptions || step === "solve") && (
        <PracticeWorkspace
          data={data}
          active={active}
          activeId={activeId}
          isLoading={isLoading}
          onSelect={setActiveId}
          onNewProblem={resetFlow}
          showNewProblem={!showAllOptions}
        />
      )}
    </div>
  );
}

function TopicSelect({
  topicSlug,
  onChange,
  className = "",
}: {
  topicSlug: string | null;
  onChange: (slug: string | null) => void;
  className?: string;
}) {
  return (
    <select
      value={topicSlug ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={`rounded-md border border-border bg-input px-3 py-2 text-sm ${className}`}
    >
      <option value="">Weakest Topic (auto)</option>
      {TOPIC_CATEGORIES.map((cat) => (
        <optgroup key={cat} label={cat}>
          {TOPIC_LIST.filter((t) => t.category === cat).map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function LanguageSelect({
  lang,
  onChange,
  className = "",
}: {
  lang: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
}) {
  return (
    <select
      value={lang}
      onChange={(e) => onChange(e.target.value as Lang)}
      className={`rounded-md border border-border bg-input px-3 py-2 text-sm font-mono ${className}`}
    >
      {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
        <option key={l} value={l}>
          {LANG_LABELS[l]}
        </option>
      ))}
    </select>
  );
}

function PracticeWorkspace({
  data,
  active,
  activeId,
  isLoading,
  onSelect,
  onNewProblem,
  showNewProblem,
}: {
  data: any;
  active: any;
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onNewProblem: () => void;
  showNewProblem: boolean;
}) {
  return (
    <div className="space-y-4">
      {showNewProblem && (
        <button
          type="button"
          onClick={onNewProblem}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> New problem
        </button>
      )}

      {isLoading && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      )}
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
                onClick={() => onSelect(p.id)}
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
  const [editorLang, setEditorLang] = useState<Lang>(lang);
  const [output, setOutput] = useState<{ stdout: string; stderr: string; exit: number } | null>(
    null,
  );
  const [editorSettings, setEditorSettings] = useState(() => {
    try {
      const raw = localStorage.getItem("codewise-editor-settings");
      if (raw) return JSON.parse(raw);
    } catch {}
    return { fontSize: 14, theme: "monokai" };
  });
  const [fullscreen, setFullscreen] = useState(false);

  const runFn = useServerFn(runCode);
  const reviewFn = useServerFn(reviewCode);
  const { track } = useTelemetry();

  useEffect(() => {
    setCode(problem.starter_code || "");
    setEditorLang(lang);
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
      const r = await runFn({
        data: { code, language: editorLang, stdin, environment: getPaddleEnvironment() },
      });
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
      const r = await reviewFn({
        data: { code, language: editorLang, environment: getPaddleEnvironment() },
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Review complete");
      track("practice_solved", {
        topic: problem.topic_slug ?? null,
        language: editorLang,
      });
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
        <Markdown className="text-muted-foreground mt-4">{problem.prompt}</Markdown>
      </div>

      <div
        className={`rounded-lg border border-border bg-card overflow-hidden ${fullscreen ? "fixed inset-0 z-50 m-0 rounded-none" : ""}`}
      >
        <div className="px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span>Editor</span>
            <select
              value={editorLang}
              onChange={(e) => setEditorLang(e.target.value as Lang)}
              className="rounded-md border border-border bg-input px-2 py-1 text-xs font-mono"
            >
              {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
                <option key={l} value={l}>
                  {LANG_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCode(problem.starter_code || "")}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-accent/10"
              title="Reset to starter code"
            >
              <RotateCcw className="size-3" /> Reset
            </button>
            <button
              onClick={() => setFullscreen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-accent/10"
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
            </button>
            <EditorSettingsPopover onChange={setEditorSettings} />
            <div className="flex gap-1 ml-1 pl-1 border-l border-border">
              <button
                onClick={onRun}
                disabled={running || reviewing}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-accent/10 disabled:opacity-50"
              >
                <Play className="size-3" /> {running ? "Running..." : "Run"}
              </button>
              <button
                onClick={onSubmit}
                disabled={running || reviewing}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="size-3" /> {reviewing ? "Reviewing..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
        <div style={{ fontSize: `${editorSettings.fontSize}px` }}>
          <CodeMirror
            value={code}
            onChange={setCode}
            extensions={[langExt(editorLang)]}
            theme={editorTheme(editorSettings.theme)}
            height={fullscreen ? "100vh" : "42vh"}
            basicSetup={{ lineNumbers: true, foldGutter: true }}
          />
        </div>
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
            {running && <span className="text-muted-foreground animate-pulse">Executing...</span>}
            {output?.stdout && <span>{output.stdout}</span>}
            {output?.stderr && <span className="text-destructive">{output.stderr}</span>}
          </pre>
        </div>
      </div>
    </article>
  );
}
