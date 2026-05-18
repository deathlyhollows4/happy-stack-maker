import { EditorView } from "@codemirror/view";

export type EditorThemeName =
  | "monokai"
  | "github"
  | "tomorrow"
  | "kuroir"
  | "twilight"
  | "dracula"
  | "xcode"
  | "textmate"
  | "solarized-dark"
  | "solarized-light"
  | "terminal"
  | "eclipse";

export const EDITOR_THEME_LABELS: Record<EditorThemeName, string> = {
  monokai: "Monokai",
  github: "Github",
  tomorrow: "Tomorrow",
  kuroir: "Kuroir",
  twilight: "Twilight",
  dracula: "Dracula",
  xcode: "Xcode",
  textmate: "TextMate",
  "solarized-dark": "Solarized Dark",
  "solarized-light": "Solarized Light",
  terminal: "Terminal",
  eclipse: "Eclipse",
};

interface ThemeColors {
  bg: string;
  text: string;
  cursor: string;
  selection: string;
  gutterBg: string;
  gutterText: string;
  activeLine: string;
}

const PALETTES: Record<EditorThemeName, ThemeColors> = {
  monokai: {
    bg: "#272822",
    text: "#f8f8f2",
    cursor: "#f8f8f0",
    selection: "#49483e88",
    gutterBg: "#2c2d27",
    gutterText: "#75715e",
    activeLine: "#3e3d32",
  },
  github: {
    bg: "#f6f8fa",
    text: "#24292e",
    cursor: "#044289",
    selection: "#c8e1ff88",
    gutterBg: "#f0f2f5",
    gutterText: "#959da5",
    activeLine: "#fffbdd88",
  },
  tomorrow: {
    bg: "#ffffff",
    text: "#4d4d4c",
    cursor: "#aeafad",
    selection: "#d6d6d688",
    gutterBg: "#f7f7f7",
    gutterText: "#8e908c",
    activeLine: "#efefef",
  },
  kuroir: {
    bg: "#e8e9e8",
    text: "#363636",
    cursor: "#202020",
    selection: "#b9dbfc88",
    gutterBg: "#dedfde",
    gutterText: "#919191",
    activeLine: "#d6d7d6",
  },
  twilight: {
    bg: "#141414",
    text: "#f8f8f8",
    cursor: "#a7a7a7",
    selection: "#5a647e88",
    gutterBg: "#1c1c1c",
    gutterText: "#5f5a60",
    activeLine: "#262626",
  },
  dracula: {
    bg: "#282a36",
    text: "#f8f8f2",
    cursor: "#f8f8f0",
    selection: "#44475a88",
    gutterBg: "#2c2e3a",
    gutterText: "#6272a4",
    activeLine: "#44475a",
  },
  xcode: {
    bg: "#ffffff",
    text: "#1f1f24",
    cursor: "#007aff",
    selection: "#a4cdfe88",
    gutterBg: "#f5f5f5",
    gutterText: "#8c8c8c",
    activeLine: "#e8f2ff",
  },
  textmate: {
    bg: "#1e1e1e",
    text: "#d4d4d4",
    cursor: "#d4d4d4",
    selection: "#264f7888",
    gutterBg: "#252525",
    gutterText: "#858585",
    activeLine: "#2a2a2a",
  },
  "solarized-dark": {
    bg: "#002b36",
    text: "#839496",
    cursor: "#586e75",
    selection: "#07364288",
    gutterBg: "#073642",
    gutterText: "#586e75",
    activeLine: "#073642",
  },
  "solarized-light": {
    bg: "#fdf6e3",
    text: "#657b83",
    cursor: "#586e75",
    selection: "#eee8d588",
    gutterBg: "#eee8d5",
    gutterText: "#93a1a1",
    activeLine: "#eee8d5",
  },
  terminal: {
    bg: "#000000",
    text: "#00ff00",
    cursor: "#00ff00",
    selection: "#00ff0022",
    gutterBg: "#0a0a0a",
    gutterText: "#00aa00",
    activeLine: "#0a0a0a",
  },
  eclipse: {
    bg: "#ffffff",
    text: "#000000",
    cursor: "#000000",
    selection: "#3399ff88",
    gutterBg: "#f0f0f0",
    gutterText: "#787878",
    activeLine: "#e8f2fe",
  },
};

export function editorTheme(name: EditorThemeName) {
  const c = PALETTES[name];
  return EditorView.theme(
    {
      "&": { backgroundColor: c.bg, color: c.text },
      ".cm-content": { caretColor: c.cursor },
      "&.cm-focused .cm-cursor": { borderLeftColor: c.cursor },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
        backgroundColor: c.selection,
      },
      ".cm-gutters": { backgroundColor: c.gutterBg, color: c.gutterText, border: "none" },
      ".cm-activeLineGutter": { backgroundColor: c.activeLine },
      ".cm-activeLine": { backgroundColor: c.activeLine },
      ".cm-cursor": { borderLeftColor: c.cursor },
      ".cm-matchingBracket": {
        backgroundColor: `${c.selection}44`,
        outline: `1px solid ${c.selection}88`,
      },
    },
    {
      dark:
        name !== "github" &&
        name !== "tomorrow" &&
        name !== "kuroir" &&
        name !== "xcode" &&
        name !== "solarized-light" &&
        name !== "eclipse",
    },
  );
}
