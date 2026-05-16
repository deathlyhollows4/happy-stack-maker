# Redesign + Cleanup Plan

## 1. Adopt editorial dark theme (from "GitHub Importer Plus")

Replace the current cyan/dark-tech aesthetic with a warm "tutor marking up a paper" look:

- **Typography**: Instrument Serif (display), Inter (body), JetBrains Mono (code). Load via Google Fonts in `src/styles.css`.
- **Palette** (OKLCH tokens in `src/styles.css`):
  - Background: near-black with warm undertone
  - Foreground: warm cream
  - Primary: warm cream (used for buttons; dark text on it)
  - Accent: burnt sienna (used for emphasis, mastery numbers)
  - Card/sidebar/muted/border/ring all retuned to match
- Update `@theme inline` to expose the new tokens plus `--color-ink`, `--color-cream`, `--font-display`.
- Update `@layer base` so `h1/h2/h3/.font-display` use the serif and selection color matches primary.

## 2. Rebuild landing page (`src/routes/index.tsx`)

Mirror the reference layout while keeping CodeWise content:

- Header: serif "CodeWise" wordmark + small mono "beta" chip, Sign in link, cream "Get started" button.
- Hero: mono kicker ("For CS students preparing for placements"), oversized serif headline with italic accent word ("teaches"), muted body copy, primary CTA + secondary text link.
- "A review, in seconds" section on `bg-card/40`: two-column mock showing a `two_sum.py` snippet and a Review card with mastery score in burnt-sienna serif, concept chips, suggested practice list.
- 3-up feature grid (Pedagogical / Knowledge tracing / Multi-language) with small accent-tinted icon tiles.
- Final centered CTA section with Sparkles icon.
- Footer: single mono line "CodeWise. Built for CS students who'd rather understand than autocomplete." (no Lovable reference).

## 3. Re-skin auth + app shell to match

Light touch-up only, no logic changes:

- `src/routes/login.tsx`, `src/routes/signup.tsx`: serif headings, cream primary buttons, muted helper text, card on warm-black.
- `src/routes/_authenticated/route.tsx` sidebar: serif "CodeWise" wordmark, cream active-state for nav items, accent tint replaced with new burnt-sienna accent.
- `src/routes/_authenticated/dashboard.tsx`, `review.tsx`, `practice.tsx`: swap chip / heading classes to use `font-display`, accent color, and the new muted/card tokens. No behavioral changes.

## 4. Remove all em dashes (`—`)

Replace every `—` in user-visible strings, titles, comments, and code with one of:
- a period + capitalized next clause, or
- a comma, or
- "to" / "and" where it reads as a range.

Files to sweep: `src/routes/index.tsx`, `src/routes/login.tsx`, `src/routes/signup.tsx`, `src/routes/_authenticated/dashboard.tsx`, `src/routes/_authenticated/practice.tsx`, `src/routes/_authenticated/review.tsx`, `src/styles.css` (comment), `src/lib/codewise.functions.ts` (prompt text + practice prompt), `src/server.ts` (comment). The dashboard fallback `"—"` becomes `"-"`.

## 5. Remove Lovable references

- `src/routes/index.tsx`: delete the "Built on Lovable" footer line.
- `src/routes/__root.tsx`: replace default meta (`title`, `description`, `author`, `og:title`, `og:description`, `twitter:site`) with CodeWise-branded values.
- Leave internal-only references untouched: `LOVABLE_API_KEY`, `ai.gateway.lovable.dev` (required for the AI gateway), and the "Connect Supabase in Lovable Cloud" diagnostic strings inside auto-generated `integrations/supabase/*` files (those are managed files and not user-visible at runtime under normal conditions).

## Out of scope

- No changes to server functions, DB schema, auth flow, or routing structure.
- No new dependencies.
