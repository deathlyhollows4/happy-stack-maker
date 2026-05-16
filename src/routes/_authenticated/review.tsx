import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { reviewCode } from "@/lib/codewise.functions";
import { toast } from "sonner";
import { Sparkles, AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/review")({
  head: () => ({ meta: [{ title: "Code Review. CodeWise" }] }),
  component: Review,
});

type Lang = "python" | "javascript" | "java" | "cpp";
const LANG_LABELS: Record<Lang, string> = { python: "Python", javascript: "JavaScript", java: "Java", cpp: "C++" };
const DEFAULTS: Record<Lang, string> = {
  python: `def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []\n`,
  javascript: `function twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++) {\n    for (let j = 0; j < nums.length; j++) {\n      if (nums[i] + nums[j] === target) return [i, j];\n    }\n  }\n}\n`,
  java: `int[] twoSum(int[] nums, int target) {\n  for (int i=0;i<nums.length;i++)\n    for (int j=0;j<nums.length;j++)\n      if (nums[i]+nums[j]==target) return new int[]{i,j};\n  return new int[]{};\n}\n`,
  cpp: `vector<int> twoSum(vector<int>& nums, int target) {\n  for (int i=0;i<nums.size();i++)\n    for (int j=0;j<nums.size();j++)\n      if (nums[i]+nums[j]==target) return {i,j};\n  return {};\n}\n`,
};

function langExt(l: Lang) {
  return l === "python" ? python() : l === "javascript" ? javascript() : l === "java" ? java() : cpp();
}

function Review() {
  const [lang, setLang] = useState<Lang>("python");
  const [code, setCode] = useState(DEFAULTS.python);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof reviewCode>> | null>(null);
  const fn = useServerFn(reviewCode);

  const onLang = (l: Lang) => { setLang(l); setCode(DEFAULTS[l]); setResult(null); };

  const submit = async () => {
    setBusy(true);
    try {
      const r = await fn({ data: { code, language: lang } });
      setResult(r);
      if (!r.ok) toast.error(r.error);
      else toast.success("Review complete");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to review");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Workspace</p>
          <h1 className="mt-2 font-display text-5xl tracking-tight">Code Review</h1>
          <p className="text-muted-foreground mt-2">Paste your code. Get concept-aware feedback.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={lang}
            onChange={(e) => onLang(e.target.value as Lang)}
            className="rounded-md border border-border bg-input px-3 py-2 text-sm font-mono"
          >
            {(Object.keys(LANG_LABELS) as Lang[]).map((l) => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
          </select>
          <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50">
            <Sparkles className="size-4" /> {busy ? "Reviewing…" : "Review my code"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border">{LANG_LABELS[lang]}</div>
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
          {!result && !busy && <p className="text-sm text-muted-foreground">Your review will appear here.</p>}
          {busy && <p className="text-sm text-muted-foreground animate-pulse">Analyzing your code…</p>}
          {result?.ok && (
            <div className="space-y-5">
              <div>
                <h3 className="font-display text-2xl mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
              </div>
              {result.concepts.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Concepts touched</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.concepts.map((c) => <span key={c} className="px-2 py-1 rounded-sm bg-accent/15 text-accent text-[11px] font-mono">{c}</span>)}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Issues ({result.issues.length})</h4>
                {result.issues.length === 0 ? (
                  <p className="text-sm text-success flex items-center gap-2"><CheckCircle2 className="size-4" /> No issues found. Nice work.</p>
                ) : (
                  <ul className="space-y-3">
                    {result.issues.map((it, i) => <IssueCard key={i} issue={it} />)}
                  </ul>
                )}
              </div>
            </div>
          )}
          {result && !result.ok && (
            <p className="text-sm text-destructive">{result.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: any }) {
  const Icon = issue.severity === "error" ? AlertCircle : issue.severity === "warning" ? AlertTriangle : Info;
  const color = issue.severity === "error" ? "text-destructive" : issue.severity === "warning" ? "text-warning" : "text-accent";
  return (
    <li className="rounded-md border border-border p-4">
      <div className="flex items-start gap-3">
        <Icon className={`size-4 mt-0.5 ${color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium">{issue.title}</span>
            {issue.line != null && <span className="text-xs font-mono text-muted-foreground">line {issue.line}</span>}
            {issue.concept_slug && <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-sm bg-accent/15 text-accent">{issue.concept_slug}</span>}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{issue.explanation}</p>
          {issue.fix_hint && (
            <p className="mt-2 text-sm border-l-2 border-accent/50 pl-3 text-foreground/90"><span className="font-mono text-[10px] uppercase tracking-widest text-accent mr-2">fix</span>{issue.fix_hint}</p>
          )}
        </div>
      </div>
    </li>
  );
}
