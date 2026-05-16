## Switch to Anthropic-style professional typography

Anthropic (claude.ai) uses **Copernicus** (a refined contemporary serif) for headings and **Styrene** (a clean grotesk) for body. Both are proprietary, so use the closest high-quality Google Fonts equivalents.

### Font choice

- **Display / headings**: `Fraunces` — modern contemporary serif with the same warm, slightly soft character as Copernicus. Use weights 400/500 with `opsz` set high for display.
- **Body / UI**: `Inter` — already loaded; keep it. Tight neutral grotesk, very close to Styrene in proportion.
- **Code**: keep `JetBrains Mono`.

This drops `Instrument Serif` (which reads as decorative/editorial) in favor of something explicitly designed for product UI.

### Changes (frontend only)

1. **`src/styles.css`**
   - Replace the `Instrument Serif` Google Fonts `@import` with `Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600`.
   - Update `--font-display` token from `"Instrument Serif"` to `"Fraunces"`.
   - Add `font-optical-sizing: auto;` and slightly tighter `letter-spacing` (`-0.02em`) on `.font-display` / `h1,h2,h3` so headings feel engineered, not literary.
   - Leave `--font-sans` (Inter) and `--font-mono` (JetBrains Mono) unchanged.

2. **No component edits required** — every heading already uses the `font-display` / `font-serif` token, so swapping the token cascades through landing, auth, dashboard, review, and practice.

### Out of scope
No color, layout, copy, or behavior changes. Only the display typeface is swapped.