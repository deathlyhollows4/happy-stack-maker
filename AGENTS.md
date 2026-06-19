<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **happy-stack-maker** (2233 symbols, 3358 relationships, 97 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/happy-stack-maker/context` | Codebase overview, check index freshness |
| `gitnexus://repo/happy-stack-maker/clusters` | All functional areas |
| `gitnexus://repo/happy-stack-maker/processes` | All execution flows |
| `gitnexus://repo/happy-stack-maker/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## Content Style

These rules apply to ALL user-facing text in source files (routes, components, meta tags, toasts). Follow them in every session.

### Never Use Em Dashes

Em dashes are a hallmark of AI-generated text. Replace with commas, semicolons, colons, or periods. In page titles and meta tags, use `|` instead.

### Banned Words & Phrases

Do not use these in site copy (landing pages, onboarding, educational content, CTAs, taglines, meta descriptions):

| Category | Banned |
|----------|--------|
| Marketing superlatives | unlock, supercharge, lightning-fast, cutting-edge, game-changing, next-level, seamless, best-in-class, world-class, state-of-the-art |
| AI trope metaphors | the magic of, the gateway to, the backbone of, the engine behind, the go-to, under the hood |
| Overly specific generic phrases | the single most, the most universal, the interview staple |
| Fluffy verbs | leverage (use "use"), empowers, elevates, transforms, revolutionizes |
| Filler phrases | delve, firstly, secondly, moreover, furthermore, consequently, in conclusion |
| Quirky analogies | "Like a patient TA with infinite office hours", "who'd rather understand than autocomplete" |
| Marketing CTA patterns | "Ready to master X?", "Watch your mastery climb from X% to Y%", "Your first review is free" (these are fine in pricing context but not in educational content) |

### Tone Rules

- **Direct and professional.** Teaching tone, not marketing tone.
- **No exclamation marks** except in toast notifications.
- **Active voice.** "The function returns" not "The value is returned by".
- **Keep AI outputs concise** (1-3 sentences per issue, 1 paragraph for summaries).
- **No self-praise or meta-commentary** in AI-generated text.
