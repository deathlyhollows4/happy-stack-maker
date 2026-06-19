# Tech Stack

## Languages
- TypeScript for app, server functions, tests, and scripts
- SQL migrations under `supabase/migrations/`

## Frameworks and Runtime
- TanStack Start v1
- TanStack Router
- React 19
- Vite 7
- Cloudflare Vite plugin
- Nitro server runtime

## UI and Client Libraries
- Tailwind CSS v4
- Radix UI primitives
- shadcn-style UI components in `src/components/ui/`
- CodeMirror 6
- TanStack Query
- Zod
- Sonner toasts

## Backend and Integrations
- Supabase JavaScript client
- Supabase Postgres with RLS
- Paddle Node SDK
- Lovable AI Gateway

## Tooling
- ESLint
- Prettier
- Vitest
- Playwright
- TypeScript strict mode
- `@/*` path alias to `src/*`

## Package Manager Notes
- The repo has both `bun.lock` and `package-lock.json`.
- Local scripts in `package.json` are generic and work with `npm run ...`.
- CI uses `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npx vitest run`, and `npm run build`.

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview the built app |
| `npm run lint` | ESLint over the repo |
| `npm run format` | Prettier write pass |
| `npm run test` | Vitest unit tests |
| `npx tsc --noEmit` | TypeScript check, used in CI |
| `npx playwright test` | E2E tests when app and env are ready |
