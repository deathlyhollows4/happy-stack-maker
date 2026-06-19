# Copilot Instructions | CodeWise

Use these files first:
- `CLAUDE.md` for repo-level rules, especially GitNexus usage and edit safety.
- `.claude/rules/architecture.md` for entrypoints and request flow.
- `.claude/rules/stack.md` for commands, runtime, and package-manager notes.
- `.claude/rules/modules.md` for route groups and domain modules.
- `.claude/rules/models.md` for Supabase tables and RPC helpers.
- `.claude/rules/api.md` for route and server-function surface.
- `.claude/rules/conventions.md` and `.claude/rules/gotchas.md` for working rules.

Project summary:
- CodeWise is a TanStack Start and React app for DSA learning and AI-assisted code review.
- Auth, data, and storage are built on Supabase.
- Billing uses Paddle.
- AI review and practice generation use the Lovable AI Gateway.

Working rules:
- Treat `.claude/rules/` as curated repo context.
- Keep `CLAUDE.md` intact because it contains repo-specific GitNexus rules.
- Validate server-function inputs with Zod and keep backend boundaries in `src/lib/*.functions.ts`.
- Use the `@/*` alias for imports from `src/*`.
- Prefer npm commands when reproducing CI, because CI uses `npm ci`.

Important caution:
- The first auto-generated memory pass was inaccurate. These refined rule files are better, but for important edits you should still verify against code and existing repo instructions.
