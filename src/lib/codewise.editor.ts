import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

export type Lang = "python" | "javascript" | "java" | "cpp" | "go";

export function langExt(l: Lang) {
  return l === "python"
    ? python()
    : l === "javascript"
      ? javascript()
      : l === "java"
        ? java()
        : cpp();
}

export function loadEditorSettings() {
  try {
    const raw = localStorage.getItem("codewise-editor-settings");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { fontSize: 14, theme: "monokai" };
}

export const LANG_LABELS: Record<Lang, string> = {
  python: "Python",
  javascript: "JavaScript",
  java: "Java",
  cpp: "C++",
  go: "Go",
};
