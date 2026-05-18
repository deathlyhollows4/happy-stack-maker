import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export type EditorThemeName =
  | "monokai"
  | "github"
  | "tomorrow"
  | "twilight"
  | "dracula"
  | "xcode"
  | "textmate"
  | "solarized-dark"
  | "solarized-light"
  | "eclipse";

export const EDITOR_THEME_LABELS: Record<EditorThemeName, string> = {
  monokai: "Monokai",
  github: "Github",
  tomorrow: "Tomorrow",
  twilight: "Twilight",
  dracula: "Dracula",
  xcode: "Xcode",
  textmate: "TextMate",
  "solarized-dark": "Solarized Dark",
  "solarized-light": "Solarized Light",
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
  keyword: string;
  string: string;
  comment: string;
  number: string;
  type: string;
  function: string;
  operator: string;
  variable: string;
  regexp: string;
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
    keyword: "#f92672",
    string: "#e6db74",
    comment: "#75715e",
    number: "#ae81ff",
    type: "#66d9ef",
    function: "#a6e22e",
    operator: "#f92672",
    variable: "#f8f8f2",
    regexp: "#e6db74",
  },
  github: {
    bg: "#f6f8fa",
    text: "#24292e",
    cursor: "#044289",
    selection: "#c8e1ff88",
    gutterBg: "#f0f2f5",
    gutterText: "#959da5",
    activeLine: "#fffbdd88",
    keyword: "#d73a49",
    string: "#032f62",
    comment: "#6a737d",
    number: "#005cc5",
    type: "#6f42c1",
    function: "#6f42c1",
    operator: "#d73a49",
    variable: "#24292e",
    regexp: "#032f62",
  },
  tomorrow: {
    bg: "#ffffff",
    text: "#4d4d4c",
    cursor: "#aeafad",
    selection: "#d6d6d688",
    gutterBg: "#f7f7f7",
    gutterText: "#8e908c",
    activeLine: "#efefef",
    keyword: "#8959a8",
    string: "#718c00",
    comment: "#8e908c",
    number: "#f5871f",
    type: "#4271ae",
    function: "#4271ae",
    operator: "#3e999f",
    variable: "#4d4d4c",
    regexp: "#718c00",
  },
  twilight: {
    bg: "#141414",
    text: "#f8f8f8",
    cursor: "#a7a7a7",
    selection: "#5a647e88",
    gutterBg: "#1c1c1c",
    gutterText: "#5f5a60",
    activeLine: "#262626",
    keyword: "#f9ee98",
    string: "#8f9d6a",
    comment: "#5f5a60",
    number: "#cf6a4c",
    type: "#cda869",
    function: "#9b703f",
    operator: "#cda869",
    variable: "#f8f8f8",
    regexp: "#8f9d6a",
  },
  dracula: {
    bg: "#282a36",
    text: "#f8f8f2",
    cursor: "#f8f8f0",
    selection: "#44475a88",
    gutterBg: "#2c2e3a",
    gutterText: "#6272a4",
    activeLine: "#44475a",
    keyword: "#ff79c6",
    string: "#f1fa8c",
    comment: "#6272a4",
    number: "#bd93f9",
    type: "#8be9fd",
    function: "#50fa7b",
    operator: "#ff79c6",
    variable: "#f8f8f2",
    regexp: "#f1fa8c",
  },
  xcode: {
    bg: "#ffffff",
    text: "#1f1f24",
    cursor: "#007aff",
    selection: "#a4cdfe88",
    gutterBg: "#f5f5f5",
    gutterText: "#8c8c8c",
    activeLine: "#e8f2ff",
    keyword: "#9b2393",
    string: "#df2c1b",
    comment: "#707f8c",
    number: "#1c00cf",
    type: "#3c6b8f",
    function: "#326d74",
    operator: "#000000",
    variable: "#1f1f24",
    regexp: "#df2c1b",
  },
  textmate: {
    bg: "#1e1e1e",
    text: "#d4d4d4",
    cursor: "#d4d4d4",
    selection: "#264f7888",
    gutterBg: "#252525",
    gutterText: "#858585",
    activeLine: "#2a2a2a",
    keyword: "#c586c0",
    string: "#ce9178",
    comment: "#6a9955",
    number: "#b5cea8",
    type: "#4ec9b0",
    function: "#dcdcaa",
    operator: "#d4d4d4",
    variable: "#d4d4d4",
    regexp: "#ce9178",
  },
  "solarized-dark": {
    bg: "#002b36",
    text: "#839496",
    cursor: "#586e75",
    selection: "#07364288",
    gutterBg: "#073642",
    gutterText: "#586e75",
    activeLine: "#073642",
    keyword: "#859900",
    string: "#2aa198",
    comment: "#586e75",
    number: "#d33682",
    type: "#b58900",
    function: "#268bd2",
    operator: "#839496",
    variable: "#839496",
    regexp: "#2aa198",
  },
  "solarized-light": {
    bg: "#fdf6e3",
    text: "#657b83",
    cursor: "#586e75",
    selection: "#eee8d588",
    gutterBg: "#eee8d5",
    gutterText: "#93a1a1",
    activeLine: "#eee8d5",
    keyword: "#859900",
    string: "#2aa198",
    comment: "#93a1a1",
    number: "#d33682",
    type: "#b58900",
    function: "#268bd2",
    operator: "#657b83",
    variable: "#657b83",
    regexp: "#2aa198",
  },
  eclipse: {
    bg: "#ffffff",
    text: "#000000",
    cursor: "#000000",
    selection: "#3399ff88",
    gutterBg: "#f0f0f0",
    gutterText: "#787878",
    activeLine: "#e8f2fe",
    keyword: "#7f0055",
    string: "#2a00ff",
    comment: "#3f7f5f",
    number: "#000000",
    type: "#7f0055",
    function: "#000000",
    operator: "#000000",
    variable: "#000000",
    regexp: "#2a00ff",
  },
};

const DARK_THEMES: EditorThemeName[] = [
  "monokai",
  "twilight",
  "dracula",
  "textmate",
  "solarized-dark",
];

export function editorTheme(name: EditorThemeName) {
  const c = PALETTES[name];
  const isDark = DARK_THEMES.includes(name);

  const base = EditorView.theme(
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
    { dark: isDark },
  );

  const highlight = syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.keyword, color: c.keyword },
      { tag: tags.string, color: c.string },
      { tag: tags.comment, color: c.comment, fontStyle: "italic" },
      { tag: tags.lineComment, color: c.comment, fontStyle: "italic" },
      { tag: tags.number, color: c.number },
      { tag: tags.typeName, color: c.type },
      { tag: tags.className, color: c.type },
      { tag: tags.function(tags.variableName), color: c.function },
      { tag: tags.definition(tags.variableName), color: c.function },
      { tag: tags.operator, color: c.operator },
      { tag: tags.variableName, color: c.variable },
      { tag: tags.regexp, color: c.regexp },
      { tag: tags.escape, color: c.regexp },
      { tag: tags.bool, color: c.number },
      { tag: tags.labelName, color: c.type },
      { tag: tags.namespace, color: c.type },
      { tag: tags.meta, color: c.comment },
      { tag: tags.tagName, color: c.keyword },
      { tag: tags.attributeName, color: c.type },
      { tag: tags.attributeValue, color: c.string },
      { tag: tags.heading, color: c.keyword, fontWeight: "bold" },
      { tag: tags.quote, color: c.string },
      { tag: tags.url, color: c.string, textDecoration: "underline" },
      { tag: tags.strong, fontWeight: "bold" },
      { tag: tags.emphasis, fontStyle: "italic" },
      { tag: tags.processingInstruction, color: c.comment },
      { tag: tags.special(tags.string), color: c.regexp },
    ]),
  );

  return [base, highlight];
}
