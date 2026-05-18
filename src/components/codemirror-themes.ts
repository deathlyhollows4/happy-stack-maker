import { EditorView } from "@codemirror/view";

// Dark theme — warm near-black matching --background oklch(0.16 0.012 60)
export const codemirrorDark = EditorView.theme(
  {
    "&": {
      backgroundColor: "#1c1917",
      color: "#e8e4d9",
    },
    ".cm-content": {
      caretColor: "#eedbad",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#eedbad",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "#6b3a1f44",
    },
    ".cm-gutters": {
      backgroundColor: "#252220",
      color: "#6b6560",
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#2d2926",
    },
    ".cm-activeLine": {
      backgroundColor: "#ffffff06",
    },
    ".cm-cursor": {
      borderLeftColor: "#eedbad",
    },
    ".cm-matchingBracket": {
      backgroundColor: "#6b3a1f33",
      outline: "1px solid #6b3a1f55",
    },
  },
  { dark: true },
);

// Light theme — warm near-white matching --background oklch(0.985 0.005 80)
export const codemirrorLight = EditorView.theme(
  {
    "&": {
      backgroundColor: "#fafaf6",
      color: "#3d342f",
    },
    ".cm-content": {
      caretColor: "#785e3c",
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#785e3c",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "#c4a26a33",
    },
    ".cm-gutters": {
      backgroundColor: "#f0efe9",
      color: "#9c958c",
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#e8e6df",
    },
    ".cm-activeLine": {
      backgroundColor: "#00000005",
    },
    ".cm-cursor": {
      borderLeftColor: "#785e3c",
    },
    ".cm-matchingBracket": {
      backgroundColor: "#c4a26a22",
      outline: "1px solid #c4a26a55",
    },
  },
  { dark: false },
);
