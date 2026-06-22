import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { type Lang, LANG_LABELS } from "@/lib/codewise.editor";
import {
  CodeWorkspace,
  loadEditorSettings,
  type EditorSettings,
} from "@/components/code-workspace";
import {
  generatePractice,
  listPractice,
  reviewCode,
  submitPracticeAttempt,
} from "@/lib/codewise.functions";
import { Markdown } from "@/components/markdown";
import { useTelemetry } from "@/hooks/use-telemetry";
import { runCode } from "@/lib/code-exec.functions";
import { getBillingEnvironment } from "@/lib/payments";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Play, Send, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  normalizeTopicSlug,
  TOPICS,
  TOPIC_CATEGORIES,
  topicDisplayName,
  type TopicSlug,
} from "@/lib/topics";

const practiceSearchSchema = z.object({
  topic: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({ meta: [{ title: "Practice | CodeWise" }] }),
  validateSearch: (search) => practiceSearchSchema.catch({}).parse(search),
  component: Practice,
});

type PracticeStep = "topic" | "language" | "solve";

interface PracticeProblem {
  id: string;
  title: string;
  prompt: string;
  starter_code: string | null;
  language: string | null;
  topic_slug: string | null;
  function_signature?: unknown;
  visible_tests?: unknown;
}

interface PracticeData {
  problems: PracticeProblem[];
}

interface GeneratePracticeResult {
  ok: boolean;
  error?: string;
  problem?: PracticeProblem;
}

interface PracticeTestRunResultView {
  id: string;
  name: string;
  visibility: "visible" | "hidden";
  passed: boolean;
  actual?: unknown;
  expected?: unknown;
  error?: string | null;
}

interface PracticeRunOutput {
  stdout: string;
  stderr: string;
  exit: number;
  testResults?: PracticeTestRunResultView[];
  testSummary?: {
    total: number;
    passed: number;
    failed: number;
    status: "passed" | "failed" | "compile_error" | "runtime_error" | "no_tests";
  };
}

interface PracticeAttemptResult {
  ok: boolean;
  error?: string;
  attemptId?: string;
  status?: "completed" | "failed";
  correctnessScore?: number;
  visibleSummary?: {
    total: number;
    passed: number;
    failed: number;
  };
  hiddenSummary?: {
    total: number;
    passed: number;
    failed: number;
  };
}

interface PracticeFunctionSignatureView {
  functionName?: unknown;
  languageSignatures?: Array<{
    language?: unknown;
    callableName?: unknown;
  }>;
}

function hasVisibleTests(problem: PracticeProblem) {
  return Array.isArray(problem.visible_tests) && problem.visible_tests.length > 0;
}

function getCallableName(problem: PracticeProblem, language: Lang) {
  const signature = problem.function_signature as PracticeFunctionSignatureView | null | undefined;
  const languageSignature = signature?.languageSignatures?.find(
    (item) => item.language === language && typeof item.callableName === "string",
  );
  if (typeof languageSignature?.callableName === "string") return languageSignature.callableName;
  if (typeof signature?.functionName === "string") return signature.functionName;
  return null;
}

function buildVisibleTestRunInput(problem: PracticeProblem, language: Lang) {
  if (!hasVisibleTests(problem)) return undefined;
  const functionName = getCallableName(problem, language);
  if (!functionName) return undefined;

  return {
    functionName,
    visibleTests: problem.visible_tests,
  };
}

function formatTestValue(value: unknown) {
  if (typeof value === "undefined") return "undefined";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

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
  const [topicSlug, setTopicSlug] = useState<TopicSlug | null>(normalizeTopicSlug(search.topic));

  const problems = (data?.problems ?? []) as PracticeProblem[];
  const active = problems.find((p) => p.id === activeId) ?? null;
  const selectedTopicName = topicSlug ? topicDisplayName(topicSlug) : "Weakest Topic (auto)";

  useEffect(() => {
    if (!activeId && data?.problems?.[0]) setActiveId(data.problems[0].id);
  }, [data, activeId]);

  const onGen = async () => {
    setBusy(true);
    try {
      const r = await gen({
        data: { language: lang, topicSlug, environment: getBillingEnvironment() },
      });
      const result = r as GeneratePracticeResult;
      if (!result.ok) {
        toast.error(result.error);
        return false;
      }
      toast.success("New problem ready");
      await refetch();
      setActiveId(result.problem?.id ?? null);
      setStep("solve");
      track("practice_generated", {
        topic: result.problem?.topic_slug ?? null,
        language: lang,
      });
      return true;
    } catch (e: unknown) {
      console.error("generatePractice failed:", e);
      toast.error(e instanceof Error ? e.message : "Could not generate a problem. Try again.");
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="size-3.5" /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 md:mb-8 gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Targeted reps
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-5xl tracking-tight">Practice</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {topicSlug
              ? `Generating problems for ${selectedTopicName}.`
              : "Auto-generated problems targeting your weakest topic."}
          </p>
        </div>
        {showAllOptions && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
            <button
              onClick={onGen}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 md:gap-2 rounded-md bg-primary px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Sparkles className="size-4" /> {busy ? "Generating..." : "Generate a problem"}
            </button>
            <TopicSelect topicSlug={topicSlug} onChange={setTopicSlug} />
            <LanguageSelect lang={lang} onChange={setLang} />
          </div>
        )}
      </div>

      {!showAllOptions && step === "topic" && (
        <section className="max-w-xl max-w-full mx-auto rounded-lg border border-border bg-card p-4 md:p-6">
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
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowAllOptions(true)}
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground"
            >
              Show all options
            </button>
            <button
              type="button"
              onClick={() => setStep("language")}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Next: Choose language
            </button>
          </div>
        </section>
      )}

      {!showAllOptions && step === "language" && (
        <section className="max-w-xl max-w-full mx-auto rounded-lg border border-border bg-card p-4 md:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Step 2 of 3</p>
          <h2 className="font-display text-3xl mt-2 mb-2">Choose language</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Topic: <span className="text-foreground">{selectedTopicName}</span>
          </p>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Language
          </label>
          <LanguageSelect lang={lang} onChange={setLang} className="mt-2 w-full" />
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep("topic")}
              className="inline-flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" /> Back to topic
            </button>
            <button
              type="button"
              onClick={onGen}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
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
  onChange: (slug: TopicSlug | null) => void;
  className?: string;
}) {
  return (
    <select
      value={topicSlug ?? ""}
      onChange={(e) => onChange(normalizeTopicSlug(e.target.value))}
      className={`rounded-md border border-border bg-input px-3 py-2 text-sm ${className}`}
    >
      <option value="">Weakest Topic (auto)</option>
      {TOPIC_CATEGORIES.map((cat) => (
        <optgroup key={cat} label={cat}>
          {TOPICS.filter((t) => t.category === cat).map((t) => (
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
  data: PracticeData | undefined;
  active: PracticeProblem | null;
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
        <div className="grid lg:grid-cols-[260px_1fr] gap-4 md:gap-6 min-w-0">
          <aside className="space-y-2 w-full overflow-hidden min-w-0">
            {data.problems.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={`w-full min-w-0 text-left rounded-md border p-3 transition ${
                  activeId === p.id
                    ? "border-accent bg-accent/10"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <div className="text-sm font-medium truncate min-w-0 max-w-full">{p.title}</div>
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

function ProblemWorkspace({ problem }: { problem: PracticeProblem }) {
  const lang = (problem.language as Lang) ?? "python";
  const nav = useNavigate();
  const [code, setCode] = useState<string>(problem.starter_code || "");
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [editorLang, setEditorLang] = useState<Lang>(lang);
  const [output, setOutput] = useState<PracticeRunOutput | null>(null);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(loadEditorSettings);
  const [fullscreen, setFullscreen] = useState(false);

  const runFn = useServerFn(runCode);
  const submitAttemptFn = useServerFn(submitPracticeAttempt);
  const reviewFn = useServerFn(reviewCode);
  const { track } = useTelemetry();

  useEffect(() => {
    setCode(problem.starter_code || "");
    setEditorLang(lang);
    setOutput(null);
  }, [problem.id, problem.starter_code, lang]);

  const onRun = async () => {
    if (!code.trim()) {
      toast.error("Write some code first.");
      return;
    }
    setRunning(true);
    setOutput(null);
    try {
      const r = await runFn({
        data: {
          code,
          language: editorLang,
          stdin,
          testRun: buildVisibleTestRunInput(problem, editorLang),
          environment: getBillingEnvironment(),
        },
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setOutput({
        stdout: r.stdout || r.compileStderr || "",
        stderr: r.stderr || "",
        exit: r.exitCode ?? 0,
        testResults: r.testResults,
        testSummary: r.testSummary,
      });
    } finally {
      setRunning(false);
    }
  };

  const onSubmit = async () => {
    if (!code.trim()) {
      toast.error("Write some code first.");
      return;
    }
    setReviewing(true);
    try {
      const attemptResponse = await submitAttemptFn({
        data: {
          practiceProblemId: problem.id,
          code,
          language: editorLang,
          environment: getBillingEnvironment(),
        },
      });
      const attempt = attemptResponse as PracticeAttemptResult;
      if (!attempt.ok) {
        toast.error(attempt.error);
        return;
      }

      const r = await reviewFn({
        data: { code, language: editorLang, environment: getBillingEnvironment() },
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Review complete");
      track("practice_solved", {
        topic: problem.topic_slug ?? null,
        language: editorLang,
        attemptId: attempt.attemptId ?? null,
        correctnessScore: attempt.correctnessScore ?? null,
        hiddenTestsPassed: attempt.hiddenSummary?.passed ?? null,
        hiddenTestsTotal: attempt.hiddenSummary?.total ?? null,
      });
      nav({ to: "/submission/$submissionId", params: { submissionId: r.submissionId! } });
    } finally {
      setReviewing(false);
    }
  };

  return (
    <article className="space-y-4 min-w-0">
      <div className="rounded-lg border border-border bg-card p-4 md:p-6">
        <h2 className="font-display text-2xl mb-1">{problem.title}</h2>
        {problem.topic_slug && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-accent/15 text-accent">
            {problem.topic_slug}
          </span>
        )}
        <Markdown className="text-muted-foreground mt-4">{problem.prompt}</Markdown>
      </div>

      <CodeWorkspace
        value={code}
        language={editorLang}
        onChange={setCode}
        settings={editorSettings}
        onSettingsChange={setEditorSettings}
        fullscreen={fullscreen}
        onFullscreenChange={setFullscreen}
        resetLabel="Reset to starter code"
        onReset={() => setCode(problem.starter_code || "")}
        height="42vh"
        label="Editor"
        showLanguageLabel={false}
        rightControls={
          <>
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
          </>
        }
      />

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
          {hasVisibleTests(problem) && (
            <p className="mt-2 text-xs text-muted-foreground">
              Visible tests run through the function signature. Stdin is used only when a problem
              has no visible test data.
            </p>
          )}
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
          {output?.testSummary && (
            <div className="mb-3 rounded-md border border-border bg-background/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium">Visible tests</span>
                <span
                  className={`text-[10px] font-mono ${
                    output.testSummary.status === "passed" ? "text-success" : "text-destructive"
                  }`}
                >
                  {output.testSummary.passed}/{output.testSummary.total} passed
                </span>
              </div>
              {output.testResults && output.testResults.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {output.testResults.map((result) => (
                    <li
                      key={result.id}
                      className="flex items-start gap-2 rounded-sm border border-border/70 p-2"
                    >
                      {result.passed ? (
                        <CheckCircle2 className="mt-0.5 size-3.5 text-success" />
                      ) : (
                        <XCircle className="mt-0.5 size-3.5 text-destructive" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">{result.name}</p>
                        {!result.passed && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Expected {formatTestValue(result.expected)}, got{" "}
                            {formatTestValue(result.actual)}
                          </p>
                        )}
                        {result.error && (
                          <p className="mt-1 text-[11px] text-destructive">{result.error}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
