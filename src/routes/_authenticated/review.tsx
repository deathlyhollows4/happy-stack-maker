import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import CodeMirror from "@uiw/react-codemirror";
import { langExt, type Lang, LANG_LABELS, loadEditorSettings } from "@/lib/codewise.editor";
import { editorTheme } from "@/components/codemirror-themes";
import { EditorSettingsPopover } from "@/components/editor-settings";
import { reviewCode } from "@/lib/codewise.functions";
import { runCode } from "@/lib/code-exec.functions";
import { Markdown } from "@/components/markdown";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTelemetry } from "@/hooks/use-telemetry";
import { getPaddleEnvironment } from "@/lib/paddle";
import { toast } from "sonner";
import {
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Upload,
  RefreshCw,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Code Review | CodeWise" }] }),
  component: Review,
});

const DEFAULTS: Record<Lang, string> = {
  python: `def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []\n`,
  javascript: `function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = 0; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) return [i, j];\n    }\n  }\n}\n`,
  java: `int[] twoSum(int[] nums, int target) {\n  for (int i=0;i<nums.length;i++)\n    for (int j=0;j<nums.length;j++)\n      if (nums[i]+nums[j]==target) return new int[]{i,j};\n  return new int[]{};\n}\n`,
  cpp: `vector<int> twoSum(vector<int>& nums, int target) {\n  for (int i=0;i<nums.size();i++)\n    for (int j=0;j<nums.size();j++)\n      if (nums[i]+nums[j]==target) return {i,j};\n  return {};\n}\n`,
};

function Review() {
  const [lang, setLang] = useState<Lang>("python");
  const [code, setCode] = useState(DEFAULTS.python);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof reviewCode>> | null>(null);
  const [exception, setException] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runOutput, setRunOutput] = useState<{
    stdout: string;
    stderr: string;
    exit: number;
  } | null>(null);
  const fn = useServerFn(reviewCode);
  const runFn = useServerFn(runCode);
  const { track } = useTelemetry();
  const [editorSettings, setEditorSettings] = useState(loadEditorSettings);
  const [fullscreen, setFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onLang = (l: Lang) => {
    setLang(l);
    setCode(DEFAULTS[l]);
    setResult(null);
    setException(null);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200_000) {
      toast.error("File too large (max 200KB).");
      return;
    }
    const text = await file.text();
    setCode(text);
    setResult(null);
    setException(null);
    // Infer language from extension
    const ext = file.name.split(".").pop()?.toLowerCase();
    const map: Record<string, Lang> = {
      py: "python",
      js: "javascript",
      mjs: "javascript",
      ts: "javascript",
      java: "java",
      cpp: "cpp",
      cc: "cpp",
      c: "cpp",
      h: "cpp",
      hpp: "cpp",
    };
    if (ext && map[ext]) setLang(map[ext]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async () => {
    setBusy(true);
    setException(null);
    try {
      const r = await fn({ data: { code, language: lang, environment: getPaddleEnvironment() } });
      setResult(r);
      if (r.ok) {
        track("review_submitted", {
          language: lang,
          concept_count: r.concepts?.length ?? 0,
          issue_count: r.issues?.length ?? 0,
        });
      }
      if (!r.ok) toast.error(r.error);
      else toast.success("Review complete");
    } catch (e: any) {
      const msg = e?.message ?? "Failed to review";
      setException(msg);
      setResult(null);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onRun = async () => {
    setRunning(true);
    setRunOutput(null);
    try {
      const r = await runFn({
        data: { code, language: lang, stdin: "", environment: getPaddleEnvironment() },
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setRunOutput({
        stdout: r.stdout || r.compileStderr || "",
        stderr: r.stderr || "",
        exit: r.exitCode ?? 0,
      });
    } finally {
      setRunning(false);
    }
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
            Workspace
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-5xl tracking-tight">Code Review</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">Paste your code to get feedback mapped to CS concepts.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".py,.js,.mjs,.ts,.java,.cpp,.cc,.c,.h,.hpp,text/plain"
            onChange={onUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 md:py-2 text-xs md:text-sm hover:bg-accent/10"
          >
            <Upload className="size-3.5 md:size-4" /> Upload file
          </button>
          <label htmlFor="review-language" className="sr-only">
            Programming language
          </label>
          <select
            id="review-language"
            aria-label="Programming language"
            value={lang}
            onChange={(e) => onLang(e.target.value as Lang)}
            className="rounded-md border border-border bg-input px-3 py-1.5 md:py-2 text-xs md:text-sm font-mono"
          >
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
              <option key={l} value={l}>
                {LANG_LABELS[l]}
              </option>
            ))}
          </select>
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 md:gap-2 rounded-md bg-primary px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Sparkles className="size-3.5 md:size-4" />
            <span className="sm:hidden">{busy ? "Reviewing..." : "Review"}</span>
            <span className="hidden sm:inline">{busy ? "Reviewing..." : "Review my code"}</span>
          </button>
          <button
            onClick={onRun}
            disabled={running}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 md:py-2 text-xs md:text-sm hover:bg-accent/10 disabled:opacity-50"
          >
            <Play className="size-3.5 md:size-4" /> {running ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div
          className={`rounded-lg border border-border bg-card overflow-hidden ${fullscreen ? "fixed inset-0 z-50 m-0 rounded-none" : ""}`}
        >
          <div className="px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border flex items-center justify-between flex-wrap gap-2">
            <span>{LANG_LABELS[lang]}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCode(DEFAULTS[lang])}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-accent/10"
                title="Reset to default"
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
            </div>
          </div>
          <div style={{ fontSize: `${editorSettings.fontSize}px` }}>
            <ErrorBoundary>
            <CodeMirror
              value={code}
              onChange={setCode}
              extensions={[langExt(lang)]}
              theme={editorTheme(editorSettings.theme)}
              height={fullscreen ? "100vh" : "clamp(40vh, 60vw, 60vh)"}
              basicSetup={{ lineNumbers: true, foldGutter: true }}
            />
            </ErrorBoundary>
          </div>
        </div>

        {runOutput && (
          <div className="rounded-lg border border-border bg-card p-3 md:p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Output
            </p>
            {runOutput.stdout && (
              <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-mono">
                {runOutput.stdout}
              </pre>
            )}
            {runOutput.stderr && (
              <pre className="text-sm text-destructive whitespace-pre-wrap font-mono mt-1">
                {runOutput.stderr}
              </pre>
            )}
            {!runOutput.stdout && !runOutput.stderr && (
              <p className="text-sm text-muted-foreground">
                Program exited with code {runOutput.exit}.
              </p>
            )}
          </div>
        )}

        <div className="rounded-lg border border-border bg-card p-4 md:p-6 min-h-[40vh] md:min-h-[60vh] overflow-auto">
          {!result && !busy && !exception && (
            <p className="text-sm text-muted-foreground">Your review will appear here.</p>
          )}
          {busy && (
            <p className="text-sm text-muted-foreground animate-pulse">Analyzing your code…</p>
          )}

          {exception && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5 text-destructive" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Review failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{exception}</p>
                </div>
              </div>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw className="size-3.5" /> Retry
              </button>
            </div>
          )}

          {result?.ok && (
            <ErrorBoundary>
            <div className="space-y-5">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <h2 className="font-display text-xl md:text-2xl mb-2">Summary</h2>
                <Markdown className="text-muted-foreground">{result.summary}</Markdown>
              </div>
              {result.concepts.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Concepts touched
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.concepts.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-1 rounded-sm bg-emerald-500/10 text-emerald-500 text-[11px] font-mono"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                  Issues ({result.issues.length})
                </h3>
                {result.issues.length === 0 ? (
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500 flex items-center gap-2">
                    <CheckCircle2 className="size-4" />
                    <span className="font-medium">No issues found. Nice work.</span>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {result.issues.map((it, i) => (
                      <IssueCard key={i} issue={it} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
            </ErrorBoundary>
          )}

          {result && !result.ok && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5 text-destructive" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Couldn't complete review</p>
                  <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
                </div>
              </div>
              <button
                onClick={submit}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <RefreshCw className="size-3.5" /> Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: any }) {
  const Icon =
    issue.severity === "error" ? AlertCircle : issue.severity === "warning" ? AlertTriangle : CheckCircle2;
  const color =
    issue.severity === "error"
      ? "text-destructive"
      : issue.severity === "warning"
        ? "text-warning"
        : "text-emerald-500";
  const hintColor = issue.severity === "info" ? "border-emerald-500/50" : "border-accent/50";
  const hintLabelColor = issue.severity === "info" ? "text-emerald-500" : "text-accent";
  const conceptClass =
    issue.severity === "info"
      ? "bg-emerald-500/10 text-emerald-500"
      : "bg-accent/15 text-accent";
  return (
    <li className="rounded-md border border-border p-3 md:p-4">
      <div className="flex items-start gap-3">
        <Icon className={`size-4 mt-0.5 ${color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium">{issue.title}</span>
            {issue.line != null && (
              <span className="text-xs font-mono text-muted-foreground">line {issue.line}</span>
            )}
            {issue.concept_slug && (
              <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-sm ${conceptClass}`}>
                {issue.concept_slug}
              </span>
            )}
          </div>
          <Markdown className="text-muted-foreground">{issue.explanation}</Markdown>
          {issue.fix_hint && (
            <div className={`mt-2 text-sm border-l-2 ${hintColor} pl-3`}>
              <span className={`font-mono text-[10px] uppercase tracking-widest ${hintLabelColor} mr-2`}>
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
