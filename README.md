# CodeWise

[![CI](https://github.com/your-org/happy-stack-maker/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/happy-stack-maker/actions/workflows/ci.yml)

AI-powered DSA learning platform for CS students. Write code, get concept-level feedback, and track mastery with spaced repetition.

## Tech Stack

- **Framework:** TanStack Start v1 (React 19, Vite 7)
- **Database:** Supabase (PostgreSQL, RLS)
- **AI:** Lovable AI Gateway → `openai/gpt-5-mini`
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

## License

Private — CodeWise by Vidhan Tomar.
