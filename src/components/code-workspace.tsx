import CodeMirror from "@uiw/react-codemirror";
import type { ReactNode } from "react";
import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { EditorSettingsPopover } from "@/components/editor-settings";
import { editorTheme } from "@/components/codemirror-themes";
import { langExt, type Lang, LANG_LABELS, loadEditorSettings } from "@/lib/codewise.editor";

export type EditorSettings = {
  fontSize: number;
  theme: string;
};

type CodeWorkspaceProps = {
  value: string;
  language: Lang;
  onChange: (value: string) => void;
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  fullscreen: boolean;
  onFullscreenChange: (fullscreen: boolean) => void;
  resetLabel: string;
  onReset: () => void;
  height: string;
  label?: string;
  rightControls?: ReactNode;
  showLanguageLabel?: boolean;
};

export { loadEditorSettings };

export function CodeWorkspace({
  value,
  language,
  onChange,
  settings,
  onSettingsChange,
  fullscreen,
  onFullscreenChange,
  resetLabel,
  onReset,
  height,
  label,
  rightControls,
  showLanguageLabel = true,
}: CodeWorkspaceProps) {
  return (
    <div
      className={`rounded-lg border border-border bg-card overflow-hidden ${fullscreen ? "fixed inset-0 z-50 m-0 rounded-none" : ""}`}
    >
      <div className="px-4 py-2 text-xs font-mono text-muted-foreground border-b border-border flex items-center justify-between flex-wrap gap-2">
        <span>{label ?? (showLanguageLabel ? LANG_LABELS[language] : "Editor")}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-accent/10"
            title={resetLabel}
          >
            <RotateCcw className="size-3" /> Reset
          </button>
          <button
            onClick={() => onFullscreenChange(!fullscreen)}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] hover:bg-accent/10"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </button>
          <EditorSettingsPopover onChange={onSettingsChange} />
          {rightControls}
        </div>
      </div>
      <div style={{ fontSize: `${settings.fontSize}px` }}>
        <ErrorBoundary>
          <CodeMirror
            value={value}
            onChange={onChange}
            extensions={[langExt(language)]}
            theme={editorTheme(settings.theme as Parameters<typeof editorTheme>[0])}
            height={fullscreen ? "100vh" : height}
            basicSetup={{ lineNumbers: true, foldGutter: true }}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
