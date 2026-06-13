# CodeWise

[![CI](https://github.com/your-org/happy-stack-maker/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/happy-stack-maker/actions/workflows/ci.yml)

AI-powered DSA learning platform for CS students. Write code, get concept-level feedback, and track mastery with spaced repetition.

## Tech Stack

- **Framework:** TanStack Start v1 (React 19, Vite 7)
- **Database:** Supabase (PostgreSQL, RLS)
- **AI:** Lovable AI Gateway (openai/gpt-5-mini)
- **Payments:** Paddle (merchant of record)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Editor:** CodeMirror 6
- **Deployment:** Cloudflare Workers (via Lovable Cloud)

## Getting Started

```bash
# Clone
git clone https://github.com/your-org/happy-stack-maker.git
cd happy-stack-maker

# Install
npm install

# Copy env and fill in values
cp .env.example .env

# Run dev server
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests (vitest) |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

## Project Structure

```
src/
  lib/
    codewise.functions.ts   # Barrel re-exports
    codewise.utils.ts        # FSRS algorithm, extractJson
    codewise.editor.ts       # CodeMirror language loader
    review.constants.ts      # SYSTEM_PROMPT, schemas, topic slugs
    review.functions.ts      # Code review server fn
    practice.functions.ts    # Practice problem generation
    dashboard.functions.ts   # Dashboard, due reviews
    admin.functions.ts        # Admin panel
    blog.functions.ts         # Blog CRUD
    consent.functions.ts      # User consent, research events
    entitlements.server.ts   # Quota/plan management
    rate-limit.ts            # In-memory rate limiter
  routes/                    # TanStack Start file-based routes
  components/                # React components (shadcn/ui, error boundary, etc.)
tests/
  lib/                       # Unit tests (vitest, 73 tests)
  e2e/                       # E2E tests (Playwright)
supabase/migrations/         # Database migrations
```

## Testing

```bash
# Unit tests
npm test

# E2E tests (requires deployed app)
npx playwright test
```

## Recent Updates

### mobile UI & green success styling (13 June 2026)

Responsive mobile-first overhaul across the 3 key student pages:

- **Review Code** (`/review`):
  - Responsive padding: `p-4 md:p-8`
  - Title scales: `text-3xl md:text-5xl`
  - Buttons stack vertically on mobile, show compact labels
  - Editor and summary column heights match via `clamp(40vh, 60vw, 60vh)`
  - Green success styling: concept tags use emerald tones, validated issues show CheckCircle2 + green

- **Submission Detail** (`/submission/$id`):
  - Same responsive padding/title sizing
  - Share and Back buttons stack on mobile
  - Code/feedback panels match heights with responsive clamp

- **Shared Review** (`/s/$id`):
  - Mobile-friendly header, smaller CTA button
  - Matched column heights

- **Practice** (`/practice`):
  - Problem list sidebar text no longer overflows on mobile (truncate + overflow-hidden)
  - 3-step stepper cards use `max-w-full` to prevent horizontal scroll
  - Generate/controls stack vertically on mobile

- **Learn** (`/learn/$slug`):
  - Fixed duplicate navbar bug (layout already had SiteHeader, slug page was rendering another)

## License

Private - CodeWise by Vidhan Tomar.
