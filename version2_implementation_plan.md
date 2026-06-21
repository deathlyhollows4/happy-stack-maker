# CodeWise Version 2 Implementation Plan

## Research Anchors

LeetCode uses bounded study plans such as LeetCode 75 and Top Interview 150, with defined problem counts, topic coverage, and completion goals. GFG's DSA tutorial starts with fundamentals and advises complete beginners to skip hard problems on the first pass. GFG practice also supports topic and difficulty oriented practice.

CodeWise v2 should use a guided curriculum, mastery bands, and structured generated problems instead of random prompt generation.

Sources:

- LeetCode 75: https://leetcode.com/studyplan/leetcode-75/
- Top Interview 150: https://leetcode.com/studyplan/top-interview-150/
- GFG DSA Tutorial: https://www.geeksforgeeks.org/dsa/dsa-tutorial-learn-data-structures-and-algorithms/
- GFG Practice: https://www.geeksforgeeks.org/explore

## Locked Product Decisions

- Product direction: guided curriculum.
- Learner baseline: true beginner path.
- Manual topic selection: guided bridge with preview.
- Difficulty control: per-topic mastery bands.
- Curriculum source: CodeWise DSA Ladder.
- Session model: learn, solve, review, adapt.
- Problem format: structured fields, not vague markdown.
- Mastery updates: weighted score from observable behavior.
- User support: both new learners and existing users, with fallback.
- Plan type: code-ready implementation plan for the current codebase.
- Schema direction: include small schema changes.
- First milestone: problem generation foundation, practice UI redesign, and mastery analytics.
- Scaffold strategy: full curriculum scaffold first.
- Curriculum depth: full structure, deep first modules.
- Existing topic model: extend, do not replace.
- Visible tests: executable in v1.
- Generation contract: strict contract with validation and fallback repair.
- Hidden tests: generate hidden tests too.
- Hidden-test scoring: generate and store, score conservatively.
- Language support: all languages in v1.
- UI priority: learner workflow clarity.
- Analytics: event log plus derived mastery.
- Weakest topic behavior: keep via curriculum planner.
- Release scope: local verified implementation plus release checklist.

## Day 1: Curriculum And Data Contract

1. ✅ Run GitNexus impact on `generatePractice`, `Practice`, `runCode`, `reviewCode`, `TOPICS`, progress update helpers, and Supabase practice tables.
2. ✅ Add `src/lib/dsa-curriculum.ts`: full CodeWise DSA Ladder scaffold, deep first modules for I/O, conditionals, loops, functions, arrays, strings, simple math, dry runs, and complexity.
3. ✅ Add mastery-band model: `0-20`, `21-40`, `41-60`, `61-80`, `81-100`, with generation rules, hint rules, and promotion criteria.
4. ✅ Add strict structured problem types and Zod schemas: title, tags, mastery band, objective, statement, examples, constraints, signature, visible tests, hidden tests, hint ladder, and success criteria.
5. ✅ Create Supabase migration for structured practice fields and attempt/event tables.
6. ✅ Add unit tests for curriculum node lookup, prerequisite gating, mastery-band selection, and unsupported topic/band rejection.

Session 1 evidence:

- `generatePractice`: LOW risk, 0 direct callers, 0 affected processes.
- `Practice`: LOW risk, 0 direct callers, 0 affected processes.
- `runCode`: LOW risk, 0 direct callers, 0 affected processes.
- `reviewCode`: LOW risk, 0 direct callers, 0 affected processes.
- `TOPICS`: LOW risk, indexed as `Const:src/lib/topics.ts:TOPICS`, 0 direct callers, 0 affected processes.
- `updateFSRS`: LOW risk, 1 direct caller, 0 affected processes. Direct caller: `reviewCode`.
- `practice_problems` and `progress` are not indexed by GitNexus as symbols. Source inspection found table usage in `practice.functions.ts`, `dashboard.functions.ts`, `admin.functions.ts`, `account.functions.ts`, export routes, generated Supabase types, and authenticated practice/dashboard UI.

Session 2 evidence:

- Added `src/lib/dsa-curriculum.ts` as a separate curriculum module that extends the existing topic model without replacing `src/lib/topics.ts`.
- Added mastery-band types, curriculum node types, full ladder scaffold, deep first modules, and lookup helpers.
- Beginner-deep nodes cover input/output, conditionals, loops, functions, simple math, dry runs, complexity, arrays, and strings.
- Later scaffold nodes cover hashing, two pointers, sliding window, binary search, sorting, linked lists, stacks, queues, recursion, trees, BST, heaps, graphs, dynamic programming, greedy, backtracking, and bit manipulation.
- Verification: `npx prettier --write src/lib/dsa-curriculum.ts version2_implementation_plan.md` completed, and `npm run build` passed after rerunning outside the sandbox.

Session 3 evidence:

- Hardened the mastery-band model in `src/lib/dsa-curriculum.ts`.
- Added `MasteryBandRules`, `MASTERY_BAND_BY_ID`, and `MASTERY_BAND_RULES`.
- Added deterministic helpers: `getMasteryBandForScore`, `isMasteryBandId`, `getMasteryBandById`, and `getMasteryBandRules`.
- Closed score-boundary gaps by making score mapping threshold-based: `<= 0.2`, `<= 0.4`, `<= 0.6`, `<= 0.8`, then `81-100`.
- Added per-band generation scope, visible test count, hidden test count, and recommended hint count.
- GitNexus could not resolve the new unindexed curriculum symbols yet, returning `UNKNOWN` for `MASTERY_BANDS` and `getMasteryBandForScore`. The edit stayed isolated to the new unreferenced curriculum module.
- Verification: `npx prettier --write src/lib/dsa-curriculum.ts version2_implementation_plan.md` completed, and `npm run build` passed.

Session 4 evidence:

- Added `src/lib/practice-problem-contract.ts` as the strict generated-problem contract for CodeWise DSA problems.
- Added Zod schemas and exported types for contract version, title, topic tags, prerequisite tags, mastery band, objective, story-free statement, examples, constraints, function signature, visible tests, hidden tests, hidden-test themes, hint ladder, and success criteria.
- Required generated problems to include Python, JavaScript, Java, C++, and Go function signatures.
- Required visible and hidden tests to be structured and executable by later harness work using arguments, expected output, comparator, theme, and visibility.
- Added strict validation helpers: `parseStructuredPracticeProblem`, `validateStructuredPracticeProblem`, and `isPracticeProblemMasteryBand`.
- Added focused tests in `tests/lib/practice-problem-contract.test.ts` for valid contracts, missing language signatures, hidden-test theme mismatches, and vague extra AI fields.
- Verification: `npx prettier --write src/lib/practice-problem-contract.ts tests/lib/practice-problem-contract.test.ts` completed, `npx vitest run tests/lib/practice-problem-contract.test.ts` passed, and `npm run build` passed after rerunning outside the sandbox.

Session 5 evidence:

- Added `supabase/migrations/20260621094500_dsa_practice_schema_foundation.sql`.
- Extended `practice_problems` with structured generation fields: contract version, curriculum node, mastery band, objective, statement, tags, examples, constraints, function signature, visible tests, hidden-test themes, hint ladder, success criteria, and generation status.
- Added `practice_problem_hidden_tests` as a server-only table for generated hidden tests. Authenticated and anonymous roles are revoked so hidden tests are not exposed through client access.
- Added `practice_attempts` for visible and hidden test outcomes, hint count, correctness score, review quality score, speed, and attempt status.
- Added `practice_events` for generation, hint, run, submission, review, and mastery analytics events.
- Added RLS and explicit grants for new tables, accounting for Supabase's 2026 change where new public tables may not be exposed to the Data API automatically.
- Updated `src/integrations/supabase/types.ts` to match the migration.
- GitNexus impact for the generated `Database` type returned `UNKNOWN`; GitNexus does not index that generated type.
- Verification: `npm run build` passed. `npx prettier --write` passed for TypeScript and Markdown; Prettier has no configured SQL parser for the migration file.
- Apply status: completed after user confirmed the migration was applied. Supabase plugin access to configured project `zjdxwczuhtdllflroggd` still returns `MCP error -32600: You do not have permission to perform this action`, so connector-level migration-history verification is unavailable from this session.

Session 6 evidence:

- Added curriculum gate helpers in `src/lib/dsa-curriculum.ts` for missing prerequisite nodes, missing prerequisite topics, and open/blocked status.
- Added topic and mastery-band support validation so unsupported curriculum requests fail with a structured reason instead of drifting into random generation.
- Added `tests/lib/dsa-curriculum.test.ts` covering curriculum node lookup, topic node lookup, prerequisite gating, mastery-band score boundaries, supported topic-band acceptance, unsupported band rejection, and unknown-topic rejection.
- GitNexus impact returned `UNKNOWN` for the new unindexed curriculum symbols: `getCurriculumNodeById`, `getMasteryBandForScore`, `isSupportedBandForNode`, and `CODEWISE_DSA_LADDER`; no HIGH or CRITICAL blast radius was reported.
- Verification: `npx prettier --write src/lib/dsa-curriculum.ts tests/lib/dsa-curriculum.test.ts` passed, and `npx vitest run tests\lib\dsa-curriculum.test.ts` passed with 8 tests.

## Day 2: Planner And Generation Foundation

1. Build `src/lib/practice-planner.server.ts` to choose a curriculum node from manual topic, weakest topic, prerequisites, mastery, and due review signals.
2. Keep "Weakest Topic (auto)" but route it through the planner instead of direct lowest-topic generation.
3. Refactor `src/lib/practice.functions.ts` to call the planner before AI generation.
4. Replace markdown-only generation with strict JSON generation and Zod validation.
5. Add one repair retry for missing or invalid generated fields, then return a safe error without inserting a weak problem.
6. Add tests for manual topic bridge behavior, auto weakest topic behavior, repair success, and repair failure.

## Day 3: Multi-Language Test Harness

1. Define a language-agnostic test case schema with input, expected output, comparator, timeout, and visibility.
2. Add test wrapper builders for Python, JavaScript, C++, Java, and Go.
3. Extend the existing code execution flow to run visible tests and normalize results across languages.
4. Generate and store hidden tests too, but mark them as conservative scoring signals.
5. Add timeout, compile error, runtime error, wrong answer, and unsupported signature normalization.
6. Add fixture tests for all five languages using simple beginner functions.

## Day 4: Practice UI Redesign

1. Redesign `src/routes/_authenticated/practice.tsx` around learner workflow clarity: curriculum node, mastery band, prerequisite status, objective, examples, tests, hints, editor, and results.
2. Render structured problem fields instead of one markdown prompt.
3. Add visible test runner UI with per-test pass/fail output.
4. Add hint ladder UI that records hint usage events.
5. Add bridge/preview messaging for manual topics above the learner's mastery.
6. Browser-check mobile and desktop layouts for text overflow, editor usability, and problem navigation.

## Day 5: Mastery Analytics

1. Add event logging for generation, visible test runs, hidden test checks, hint usage, submissions, completion, and review quality.
2. Build derived mastery scoring from correctness, attempts, hint usage, review quality, speed as secondary, and repeat performance.
3. Update mastery across the primary topic plus prerequisite topics.
4. Add conservative hidden-test contribution so hidden tests do not become the sole pass/fail gate.
5. Update dashboard and practice surfaces to show mastery band and next recommended curriculum node.
6. Add tests for mastery deltas, prerequisite updates, repeated attempts, and spaced review confirmation.

## Day 6: Integration And Reliability

1. Update `listPractice` and practice history to include structured fields and attempt summaries.
2. Update review submission flow so practice attempts can feed review quality and topic mastery.
3. Add admin/export compatibility for new practice fields and event logs.
4. Add migration backfill behavior for old markdown-only `practice_problems`.
5. Run focused tests for curriculum, generation, planner, harness, practice UI, and mastery analytics.
6. Run `npm run build`, touched-file Prettier, and GitNexus detect-changes.

## Day 7: Product Verification And Release Checklist

1. Seed or mock a beginner user with empty mastery and verify first generated problem starts at true beginner level.
2. Verify manual advanced topic selection creates guided bridge plus preview, not a random advanced problem.
3. Verify all five language harnesses on the same beginner problem.
4. Verify visible tests, hidden tests, hint events, attempt events, and mastery deltas.
5. Browser-test authenticated practice flow, dashboard weak-topic entry, learn-page practice link, and mobile layout.
6. Prepare release checklist: migrations, environment assumptions, rollback plan, known risks, test evidence, GitNexus risk summary, and production deploy steps.

## Execution Order

The first coding milestone should be Day 1 through Day 2: curriculum scaffold, strict problem contract, planner, and validated generation. Without that foundation, the UI and analytics will only decorate random problem generation.

Main risk: all languages in v1 is the largest scope driver. The plan handles it by making the test schema language-agnostic, then building thin adapters per language with normalized results.
