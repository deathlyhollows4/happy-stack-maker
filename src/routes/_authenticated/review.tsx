import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { reviewCode } from "@/lib/codewise.functions";
import { Markdown } from "@/components/markdown";
import { getPaddleEnvironment } from "@/lib/paddle";
import { toast } from "sonner";
import {
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowLeft,
  Upload,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Code Review. CodeWise" }] }),
  component: Review,
});

type Lang = "python" | "javascript" | "java" | "cpp";
const LANG_LABELS: Record<Lang, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
};
const DEFAULTS: Record<Lang, string> = {
  python: `def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []\n`,
  javascript: `function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = 0; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) return [i, j];\n    }\n  }\n}\n`,
  java: `int[] twoSum(int[] nums, int target) {\n  for (int i=0;i<nums.length;i++)\n    for (int j=0;j<nums.length;j++)\n      if (nums[i]+nums[j]==target) return new int[]{i,j};\n  return new int[]{};\n}\n`,
  cpp: `vector<int> twoSum(vector<int>& nums, int target) {\n  for (int i=0;i<nums.size();i++)\n    for (int j=0;j<nums.size();j++)\n      if (nums[i]+nums[j]==target) return {i,j};\n  return {};\n}\n`,
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

function Review() {
  const [lang, setLang] = useState<Lang>("python");
  const [code, setCode] = useState(DEFAULTS.python);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof reviewCode>> | null>(null);
  const [exception, setException] = useState<string | null>(null);
  const fn = useServerFn(reviewCode);
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
            Workspace
          </p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Code Review</h1>
          <p className="text-muted-foreground mt-2">Paste your code. Get concept-aware feedback.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".py,.js,.mjs,.ts,.java,.cpp,.cc,.c,.h,.hpp,text/plain"
            onChange={onUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent/10"
          >
            <Upload className="size-4" /> Upload file
          </button>
          <select
            value={lang}
            onChange={(e) => onLang(e.target.value as Lang)}
            className="rounded-md border border-border bg-input px-3 py-2 text-sm font-mono"
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
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Sparkles className="size-4" /> {busy ? "Reviewing…" : "Review my code"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border">
            {LANG_LABELS[lang]}
          </div>
          <CodeMirror
            value={code}
            onChange={setCode}
            extensions={[langExt(lang)]}
            theme={oneDark}
            height="60vh"
            basicSetup={{ lineNumbers: true, foldGutter: true }}
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-6 min-h-[60vh] overflow-auto">
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
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-2xl mb-2">Summary</h3>
                <Markdown className="text-muted-foreground">{result.summary}</Markdown>
              </div>
              {result.concepts.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Concepts touched
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.concepts.map((c) => (
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
                  Issues ({result.issues.length})
                </h4>
                {result.issues.length === 0 ? (
                  <p className="text-sm text-success flex items-center gap-2">
                    <CheckCircle2 className="size-4" /> No issues found. Nice work.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {result.issues.map((it, i) => (
                      <IssueCard key={i} issue={it} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
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
