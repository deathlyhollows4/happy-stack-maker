import { useState, useCallback } from "react";
import { Settings } from "lucide-react";
import { type EditorThemeName, EDITOR_THEME_LABELS } from "@/components/codemirror-themes";

export const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 22] as const;

export type EditorSettings = {
  fontSize: number;
  theme: EditorThemeName;
};

const STORAGE_KEY = "codewise-editor-settings";

function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.fontSize === "number" && typeof parsed.theme === "string") {
        return parsed as EditorSettings;
      }
    }
  } catch {
    // ignore
  }
  return { fontSize: 14, theme: "monokai" };
}

function saveSettings(s: EditorSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

interface Props {
  onChange: (s: EditorSettings) => void;
}

export function EditorSettingsPopover({ onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<EditorSettings>(loadSettings);

  const update = useCallback(
    (partial: Partial<EditorSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial };
        saveSettings(next);
        onChange(next);
        return next;
      });
    },
    [onChange],
  );

  return (
    <div className="relative inline-flex">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-accent/10"
        title="Editor settings"
      >
        <Settings className="size-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 rounded-md border border-border bg-popover shadow-lg z-50 p-3 space-y-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                Font Size
              </p>
              <select
                value={settings.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs font-mono"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}px
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">
                Theme
              </p>
              <select
                value={settings.theme}
                onChange={(e) => update({ theme: e.target.value as EditorThemeName })}
                className="w-full rounded-md border border-border bg-input px-2 py-1.5 text-xs font-mono"
              >
                {(Object.keys(EDITOR_THEME_LABELS) as EditorThemeName[]).map((t) => (
                  <option key={t} value={t}>
                    {EDITOR_THEME_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
