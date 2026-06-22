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

1. ✅ Build `src/lib/practice-planner.server.ts` to choose a curriculum node from manual topic, weakest topic, prerequisites, mastery, and due review signals.
2. ✅ Keep "Weakest Topic (auto)" but route it through the planner instead of direct lowest-topic generation.
3. ✅ Refactor `src/lib/practice.functions.ts` to call the planner before AI generation.
4. ✅ Replace markdown-only generation with strict JSON generation and Zod validation.
5. ✅ Add one repair retry for missing or invalid generated fields, then return a safe error without inserting a weak problem.
6. ✅ Add tests for manual topic bridge behavior, auto weakest topic behavior, repair success, and repair failure.

Session 1 evidence:

- Added `src/lib/practice-planner.server.ts` as the deterministic planner foundation for the v2 practice flow.
- Planner priority is manual topic, then due review, then weakest topic, then true beginner start.
- Planner resolves blocked targets to the earliest open prerequisite bridge node and keeps the requested target as a preview for guided bridge behavior.
- Planner maps mastery scores to supported curriculum bands and adjusts unsupported low bands to the node's lowest supported band.
- Added `tests/lib/practice-planner.test.ts` covering true beginner start, manual advanced-topic bridge, due-review priority, weakest-topic auto selection, unsupported-band adjustment, and unknown-topic fallback.
- Verification: `npx prettier --write src/lib/practice-planner.server.ts tests/lib/practice-planner.test.ts` passed, and `npx vitest run tests\lib\practice-planner.test.ts` passed with 6 tests.

Session 2 evidence:

- Kept the practice UI option label as `Weakest Topic (auto)`.
- Replaced the direct lowest-mastery fallback inside `generatePractice` with `planPracticeSession`.
- `generatePractice` now loads progress rows with mastery, attempts, next review date, last reviewed date, and retrievability, maps them into planner input, and lets the planner choose the auto curriculum node.
- Legacy prompt generation now includes curriculum node, objective, mastery band, generation rule, concepts, practice patterns, and guided bridge preview context.
- Generated practice rows now store planner metadata in `curriculum_node_id`, `mastery_band`, and `objective`.
- Added `mapProgressRowsForPracticePlanner` and a focused unit test for Supabase progress row mapping.
- GitNexus impact for `generatePractice`: LOW risk, 0 direct callers, 0 affected processes. GitNexus impact for `practiceUserPrompt`: LOW risk, 1 direct caller, 0 affected processes.
- Verification: `npx prettier --write src/lib/practice.functions.ts src/lib/practice-planner.server.ts tests/lib/practice-planner.test.ts` passed, and `npx vitest run tests\lib\practice-planner.test.ts` passed with 7 tests.

Session 3 evidence:

- Added `src/lib/practice-generation-plan.server.ts` as the explicit generation-planning boundary used before AI generation.
- `generatePractice` now builds a `generationPlan` from the selected topic and progress rows before composing the AI prompt or insert payload.
- The generation plan carries normalized requested topic, selected AI prompt topic, planner result, and planned `practice_problems` insert metadata.
- Added `tests/lib/practice-generation-plan.test.ts` covering manual-topic bridge metadata and weakest-topic auto metadata.
- GitNexus impact for `generatePractice`: LOW risk, 0 direct callers, 0 affected processes. GitNexus impact for `practiceUserPrompt`: LOW risk, 1 direct caller, 0 affected processes.
- Verification: `npx prettier --write src/lib/practice.functions.ts src/lib/practice-generation-plan.server.ts tests/lib/practice-generation-plan.test.ts` passed, and `npx vitest run tests\lib\practice-generation-plan.test.ts tests\lib\practice-planner.test.ts` passed with 9 tests.

Session 4 evidence:

- Replaced the legacy `{ title, prompt, starter_code }` AI response with the strict structured practice problem contract.
- Added `src/lib/practice-structured-problem.server.ts` for plan-aware Zod validation, deterministic prompt formatting, requested-language starter code selection, structured insert payloads, and hidden-test insert payloads.
- `generatePractice` now requests structured JSON only, validates curriculum node, mastery band, and objective against the planner result, stores structured fields on `practice_problems`, marks rows as `structured`, and stores generated hidden tests in `practice_problem_hidden_tests`.
- Added `tests/lib/practice-structured-problem.test.ts` covering plan-aware validation, wrong-band rejection, deterministic prompt formatting, structured insert payloads, and starter-code selection.
- GitNexus impact for `generatePractice`: LOW risk, 0 direct callers, 0 affected processes. GitNexus impact for `practiceSystemPrompt`: LOW risk, 1 direct caller, 0 affected processes. GitNexus impact for `practiceUserPrompt`: LOW risk, 1 direct caller, 0 affected processes. `PracticeResponseSchema` was not indexed by GitNexus.
- Verification: `npx prettier --write src/lib/practice.functions.ts src/lib/practice-structured-problem.server.ts tests/lib/practice-structured-problem.test.ts` passed, and `npx vitest run tests\lib\practice-structured-problem.test.ts tests\lib\practice-problem-contract.test.ts` passed with 9 tests.

Session 5 evidence:

- Added `src/lib/practice-generation-repair.server.ts` as the structured generation repair boundary.
- `generatePractice` now makes one strict JSON generation attempt with `maxAttempts: 1`, runs exactly one repair prompt when invalid raw content is available, and skips repair for gateway or status failures.
- Repair failure returns the safe malformed-response error before any `practice_problems` or `practice_problem_hidden_tests` insert path runs.
- Added `tests/lib/practice-generation-repair.test.ts` covering first-attempt success, repair success, gateway failure without repair, repair failure, and invalid-content truncation in the repair prompt.
- GitNexus impact for `generatePractice`: LOW risk, 0 direct callers, 0 affected processes.
- Verification: `npx prettier --write src/lib/practice.functions.ts src/lib/practice-generation-repair.server.ts tests/lib/practice-generation-repair.test.ts mesh/tasks/forge-day2-session5-repair.md mesh/tasks/sentinel-day2-session6-coverage.md mesh/next_session.md` passed, and `npx vitest run tests\lib\practice-generation-repair.test.ts tests\lib\practice-planner.test.ts tests\lib\practice-generation-plan.test.ts` passed with 14 tests.

Session 6 evidence:

- Confirmed `tests/lib/practice-planner.test.ts` covers manual advanced-topic bridge behavior and auto weakest-topic behavior.
- Confirmed `tests/lib/practice-generation-plan.test.ts` covers manual-topic bridge metadata and weakest-topic auto metadata before AI generation.
- Confirmed `tests/lib/practice-generation-repair.test.ts` covers repair success and repair failure.
- Agent Mesh lanes were used for this session: Kepler implemented the repair workflow and Euclid verified planner/generation coverage.
- Verification: `npx vitest run tests\lib\practice-generation-repair.test.ts tests\lib\practice-planner.test.ts tests\lib\practice-generation-plan.test.ts` passed with 14 tests.

## Day 3: Multi-Language Test Harness

1. ✅ Define a language-agnostic test case schema with input, expected output, comparator, timeout, and visibility.
2. ✅ Add test wrapper builders for Python, JavaScript, C++, Java, and Go.
3. ✅ Extend the existing code execution flow to run visible tests and normalize results across languages.
4. ✅ Generate and store hidden tests too, but mark them as conservative scoring signals.
5. ✅ Add timeout, compile error, runtime error, wrong answer, and unsupported signature normalization.
6. ✅ Add fixture tests for all five languages using simple beginner functions.

Session 1 evidence:

- Added `src/lib/practice-test-harness.ts` as the language-agnostic runtime test schema foundation.
- Defined strict test-case fields for id, name, input, expected output, comparator, timeout, and visibility.
- Added timeout bounds with a conservative default of 3000 ms and support for visible and hidden test visibility.
- Added normalization helpers that convert generated `visibleTests` and `hiddenTests` from the structured problem contract into harness-ready test cases.
- Added `tests/lib/practice-test-harness.test.ts` covering valid harness cases, generated-test normalization, hidden visibility preservation, missing input rejection, timeout bounds, and extra-field rejection.
- Verification: `npx prettier --write src/lib/practice-test-harness.ts tests/lib/practice-test-harness.test.ts` passed, and `npx vitest run tests\lib\practice-test-harness.test.ts` passed with 5 tests.

Session 2 evidence:

- Added `src/lib/practice-test-wrappers.ts` as the language adapter layer for generated practice tests.
- Added wrapper builders for Python, JavaScript, Java, C++, and Go.
- Builders embed harness-ready test cases, call the selected function, compare actual output to expected output, and print a normalized `codewiseTestResults` JSON payload.
- Added conservative literal builders for beginner-friendly primitive values and flat primitive arrays across Java, C++, and Go.
- Added JavaScript export stripping so generated starter code can run in the current script-style execution path.
- Added `tests/lib/practice-test-wrappers.test.ts` covering all five language builders and invalid function-name rejection.
- Verification: `npx prettier --write src/lib/practice-test-wrappers.ts tests/lib/practice-test-wrappers.test.ts` passed, and `npx vitest run tests\lib\practice-test-wrappers.test.ts tests\lib\practice-test-harness.test.ts` passed with 11 tests.

Session 3 evidence:

- Added `src/lib/practice-test-execution.ts` as the pure bridge between stored visible tests, wrapper generation, and normalized execution results.
- Extended `runCode` so practice problems can send `testRun` metadata, wrap user code with visible tests, execute through Piston, and return `testResults` plus `testSummary` while preserving raw stdin execution.
- Added Go to the shared language constants, editor labels, review defaults, and code execution runtime mapping.
- Updated the practice UI to send visible tests when available and render per-test pass/fail output, expected values, actual values, and runtime errors.
- Verified Piston currently exposes Go as language `go` version `1.16.2`.
- GitNexus impact for `runCode`: LOW risk, 0 direct callers, 0 affected processes.
- GitNexus impact for `ProblemWorkspace`: LOW risk, 1 direct caller, 2 affected processes: `PracticeWorkspace` and `Practice`.
- GitNexus impact for `langExt`: HIGH risk because it feeds the shared editor across practice, review, submission detail, and share pages. The edit stayed minimal: add Go to the language union and label map while keeping the existing C++ editor extension fallback.
- GitNexus impact for `Review`: LOW risk, 0 direct callers, 0 affected processes. GitNexus impact for `LANGS`: LOW risk, 0 direct callers, 0 affected processes.
- Focused verification: `npx vitest run tests\lib\practice-test-execution.test.ts tests\lib\practice-test-wrappers.test.ts tests\lib\practice-test-harness.test.ts tests\lib\review-constants.test.ts` passed with 44 tests.
- Build verification: `npm run build` passed with the existing large-chunk and TanStack unused-import warnings.

Session 4 evidence:

- Added `src/lib/practice-attempt.functions.ts` with `submitPracticeAttempt`, a server-only hidden-check submission path.
- The submission path fetches hidden tests through `supabaseAdmin`, validates visible tests, hidden tests, and function signatures with Zod, runs visible plus hidden checks through the shared multi-language wrapper, and stores a `practice_attempts` row.
- Hidden tests stay private: the client receives only attempt id, status, correctness score, visible counts, hidden counts, and execution status.
- Added `src/lib/practice-attempt-scoring.ts` for conservative scoring: visible tests carry 75% weight, hidden tests carry 25% weight, and hidden passes cannot complete an attempt when visible tests fail.
- Updated the practice submit workflow to record the attempt before the existing AI review and include hidden-test aggregate counts in telemetry.
- GitNexus impact for `ProblemWorkspace`: LOW risk, 1 direct caller, 2 affected processes: `PracticeWorkspace` and `Practice`.
- GitNexus could not resolve the new Day 3 helper symbols yet, returning `UNKNOWN` or not found for newly added/unindexed practice test execution symbols. The edit stayed scoped to the new hidden-attempt server boundary and the existing practice submit flow.
- Focused verification: `npx vitest run tests\lib\practice-attempt-scoring.test.ts tests\lib\practice-test-execution.test.ts tests\lib\practice-test-wrappers.test.ts` passed with 24 tests.
- Build verification: `npm run build` passed with the existing large-chunk and TanStack unused-import warnings.

Session 5 evidence:

- Expanded normalized practice execution statuses to distinguish passed, wrong answer, compile error, runtime error, timeout, unsupported signature, and no-tests outcomes.
- Added timeout detection from execution stderr, compile stderr, and Piston run signals so time-limit failures do not collapse into generic runtime errors.
- Classified failed wrapper payloads with thrown per-test errors as runtime errors, and failed comparisons without runtime errors as wrong answers.
- Added `buildPracticeExecutionFailure` for non-runnable harness failures, including unsupported signature cases.
- Updated visible test runs and hidden-attempt submissions to return normalized unsupported-signature summaries instead of throwing or storing vague failures.
- Updated the practice UI status label union to show the precise visible-test execution category.
- GitNexus impact for `runCode`: LOW risk, 0 direct callers, 0 affected processes.
- GitNexus impact for `buildPracticeTestWrapper`: LOW risk, 0 direct callers, 0 affected processes.
- GitNexus impact for `ProblemWorkspace`: LOW risk, 1 direct caller, 2 affected processes: `PracticeWorkspace` and `Practice`.
- GitNexus could not resolve newer Day 3 symbols `normalizePracticeExecutionResult`, `executePracticeTests`, or `PracticeExecutionStatusSchema`, returning `UNKNOWN` or not found.
- Focused verification: `npx vitest run tests\lib\practice-test-execution.test.ts tests\lib\practice-test-wrappers.test.ts tests\lib\practice-attempt-scoring.test.ts` passed with 27 tests.

Session 6 evidence:

- Added a shared beginner count-positive fixture suite in `tests/lib/practice-test-wrappers.test.ts`.
- The fixture uses the same two visible tests across Python, JavaScript, Java, C++, and Go: empty input and mixed positive/non-positive values.
- Verified each wrapper keeps the expected runtime filename, test count, normalized test ids, language-specific callable invocation, and `codewiseTestResults` payload.
- GitNexus impact for `buildPracticeTestWrapper`: LOW risk, 0 direct callers, 0 affected processes.
- Focused verification: `npx vitest run tests\lib\practice-test-wrappers.test.ts tests\lib\practice-test-harness.test.ts tests\lib\practice-test-execution.test.ts` passed with 32 tests.
- Full verification: `npm test` passed with 157 tests and 3 skipped tests.
- Build verification: `npm run build` passed with the existing large-chunk and TanStack unused-import warnings.

## Day 4: Practice UI Redesign

1. ✅ Redesign `src/routes/_authenticated/practice.tsx` around learner workflow clarity: curriculum node, mastery band, prerequisite status, objective, examples, tests, hints, editor, and results.
2. ✅ Render structured problem fields instead of one markdown prompt.
3. ✅ Add visible test runner UI with per-test pass/fail output.
4. ✅ Add hint ladder UI that records hint usage events.
5. ✅ Add bridge/preview messaging for manual topics above the learner's mastery.
6. ✅ Browser-check mobile and desktop layouts for text overflow, editor usability, and problem navigation.

Session 1 evidence:

- Added `src/lib/practice-problem-view.ts` as a safe view-model layer for structured `practice_problems` rows, with legacy markdown fallback for older rows.
- Updated `src/routes/_authenticated/practice.tsx` to show the CodeWise DSA Ladder workflow, curriculum node, mastery band, topic and prerequisite tags, objective, story-free statement, examples, constraints, expected function signature, visible tests, hidden-test themes, hint ladder, success criteria, editor, stdin, and run output.
- Updated the practice problem list so learners can scan mastery band and curriculum node before opening a problem.
- Kept the existing run, visible-test execution, hidden-test submission, AI review, telemetry, and navigation flows unchanged.
- GitNexus impact for `Practice`: LOW risk, 0 direct callers, 0 affected processes.
- GitNexus impact for `PracticeWorkspace`: LOW risk, 1 direct caller, 1 affected process.
- GitNexus impact for `ProblemWorkspace`: LOW risk, 1 direct caller, 2 affected processes.
- GitNexus impact for `hasVisibleTests`: HIGH risk, 2 direct callers, 3 affected processes. The helper behavior was intentionally left unchanged.
- GitNexus detect-changes reported CRITICAL risk because the authenticated practice route participates in `Practice`, `PracticeWorkspace`, `onRun`, `onGen`, and `onSubmit` flows. The edit is expected for this session and keeps run, submit, review, and telemetry behavior unchanged.
- Focused verification: `npx vitest run tests\lib\practice-problem-view.test.ts` passed with 4 tests.
- Build verification: `npm run build` passed with the existing large-chunk and TanStack unused-import warnings.

Session 2 evidence:

- Added structured problem body selection to `src/lib/practice-problem-view.ts`, so structured rows render the stored statement and legacy markdown is used only for legacy rows.
- Added safe missing-statement behavior for incomplete structured rows instead of showing the stored markdown prompt as the primary problem body.
- Added normalized visible-test run input helpers so the practice route uses parsed structured fields for callable names and visible tests.
- Updated `src/routes/_authenticated/practice.tsx` to use the normalized view model for body rendering, visible-test execution metadata, and stdin guidance.
- Added focused tests for structured body rendering, legacy markdown fallback, missing structured statements, and normalized visible-test run input.
- GitNexus impact for `hasVisibleTests`: HIGH risk, 2 direct callers, 3 affected processes. The helper was replaced by view-model checks with the same visible-test behavior for valid structured rows.
- GitNexus impact for route `getCallableName`: LOW risk, 1 direct caller, 1 affected process.
- GitNexus impact for `buildVisibleTestRunInput`: LOW risk, 1 direct caller, 1 affected process.
- GitNexus impact for `ProblemWorkspace`: LOW risk, 1 direct caller, 2 affected processes.
- GitNexus could not resolve newly added Day 4 symbols `buildPracticeProblemView`, `ProblemBrief`, or `VisibleTestsSection`, returning `UNKNOWN` or not found.
- Focused verification: `npx vitest run tests\lib\practice-problem-view.test.ts` passed with 7 tests.
- Related verification: `npx vitest run tests\lib\practice-problem-view.test.ts tests\lib\practice-test-execution.test.ts tests\lib\practice-test-harness.test.ts` passed with 23 tests.
- Full verification: `npm test` passed with 164 tests and 3 skipped tests. Existing `tests/lib/ai-workflow.test.ts` stderr covered rate-limit and malformed-JSON retry fixtures.
- Build verification: `npm run build` passed with the existing Lovable context notice, large-chunk warning, and TanStack unused-import warnings.
- GitNexus detect-changes reported medium risk across 4 files and 7 symbols, affecting 3 practice-related execution flows.

Session 3 evidence:

- Added `src/lib/practice-run-output-view.ts` as a pure visible-test runner view layer for idle, running, visible-test, unsupported-signature, and stdin fallback states.
- Updated `src/routes/_authenticated/practice.tsx` with a dedicated output panel that shows visible-test status, per-test pass/fail rows, expected values, actual values, errors, and cleaned program output without raw harness JSON.
- Updated the run button and stdin guidance so learners can see whether the current language will run visible tests or fall back to stdin because the function signature is unsupported.
- Added `tests/lib/practice-run-output-view.test.ts` covering status formatting, harness-payload stripping, idle state, per-test rows, unsupported-signature errors, and stdin fallback output.
- GitNexus impact for `ProblemWorkspace`: LOW risk, 1 direct caller, 2 affected processes: `PracticeWorkspace` and `Practice`.
- GitNexus impact for `formatTestValue`: LOW risk, 1 direct caller, 2 affected processes: `PracticeWorkspace` and `Practice`.
- GitNexus impact for `formatExecutionStatus`: LOW risk, 1 direct caller, 2 affected processes: `PracticeWorkspace` and `Practice`.
- Focused verification: `npx vitest run tests\lib\practice-run-output-view.test.ts` passed with 6 tests.
- Related verification: `npx vitest run tests\lib\practice-problem-view.test.ts tests\lib\practice-test-execution.test.ts tests\lib\practice-test-harness.test.ts` passed with 23 tests.
- Full verification: `npm test` passed with 170 tests and 3 skipped tests. Existing `tests/lib/ai-workflow.test.ts` stderr covered rate-limit and malformed-JSON retry fixtures.
- Scoped lint verification: `npx eslint src\lib\practice-run-output-view.ts tests\lib\practice-run-output-view.test.ts src\routes\_authenticated\practice.tsx` passed.
- Build verification: `npm run build` passed with the existing Lovable context notice, large-chunk warning, and TanStack unused-import warnings.
- GitNexus detect-changes with `--scope staged` reported HIGH risk across 4 files and 7 indexed symbols, affecting 8 existing `PracticeWorkspace` flows. The affected scope is expected because the output panel lives inside the authenticated practice workspace.

Session 4 evidence:

- Added `src/lib/practice-event-model.ts` as the typed practice event model for `practice_hint_revealed`, including Zod input validation, hint reveal dedupe, and deterministic hint usage payloads.
- Added `src/lib/practice-event.functions.ts` with `recordPracticeEvent`, a server-authenticated insert path for the existing `practice_events` table.
- Updated `src/routes/_authenticated/practice.tsx` so opening a hint records one event per hint, shows revealed hint count in the ladder, falls back to existing telemetry if the event insert fails, and sends revealed hint count into `submitPracticeAttempt`.
- Added `tests/lib/practice-event-model.test.ts` for hint reveal dedupe, event payload shape, and event input validation.
- No new migration was required because Day 1 Session 5 already created `practice_events` with RLS, authenticated grants, and indexes. Supabase changelog and RLS docs were checked before using the existing table.
- GitNexus index was refreshed with `npx gitnexus analyze --force` after degraded keyword search. GitNexus impact for `HintsSection`: HIGH risk, 1 direct caller, 3 affected processes: `ProblemWorkspace`, `PracticeWorkspace`, and `Practice`. GitNexus impact for `ProblemWorkspace`: LOW risk, 1 direct caller, 2 affected processes. GitNexus impact for `submitPracticeAttempt`: LOW risk, 0 direct callers, 0 affected processes.
- Focused verification: `npx vitest run tests\lib\practice-event-model.test.ts` passed with 3 tests.
- Related verification: `npx vitest run tests\lib\practice-problem-view.test.ts tests\lib\practice-run-output-view.test.ts tests\lib\practice-test-execution.test.ts tests\lib\practice-test-harness.test.ts tests\lib\practice-attempt-scoring.test.ts` passed with 34 tests.
- Full verification: `npm test` passed with 173 tests and 3 skipped tests. Existing `tests/lib/ai-workflow.test.ts` stderr covered rate-limit and malformed-JSON retry fixtures.
- Scoped lint verification: `npx eslint src\lib\practice-event-model.ts src\lib\practice-event.functions.ts tests\lib\practice-event-model.test.ts src\routes\_authenticated\practice.tsx` passed.
- Build verification: `npm run build` passed with the existing Lovable context notice, large-chunk warning, and TanStack unused-import warnings.
- GitNexus detect-changes with `--scope staged` reported CRITICAL risk across 5 files and 20 indexed symbols, affecting 16 existing practice execution flows. The affected scope is expected because hint event recording and hint-count submission live inside the authenticated practice workspace.

Session 5 evidence:

- Added `supabase/migrations/20260622170000_add_practice_planning_context.sql` to persist `practice_problems.planning_context` as a JSONB object.
- Updated `src/lib/practice-generation-plan.server.ts` so each generated problem stores planner source, requested topic, selected curriculum node, selected mastery band, and bridge preview target.
- Updated `src/lib/practice-structured-problem.server.ts` and `src/integrations/supabase/types.ts` so structured practice inserts include `planning_context`.
- Updated `src/lib/practice-problem-view.ts` so bridge preview rendering only appears for persisted `manual-topic` planner context with a bridge preview target.
- Updated `src/routes/_authenticated/practice.tsx` with a compact Bridge preview callout and bridge pill in the problem brief.
- Added focused tests in `tests/lib/practice-generation-plan.test.ts`, `tests/lib/practice-structured-problem.test.ts`, and `tests/lib/practice-problem-view.test.ts` for planner metadata persistence, insert payloads, manual bridge preview rendering, and non-manual no-bridge behavior.
- Updated `tests/lib/practice-event-model.test.ts` for the expanded practice problem view type.
- Supabase changelog, API exposure docs, and RLS docs were checked. The Supabase CLI was not installed locally, so the migration file was created manually and has not been applied.
- GitNexus impact for `buildPracticeProblemView`: HIGH risk, 2 direct callers, 3 affected processes: `PracticeWorkspace`, `ProblemWorkspace`, and `Practice`.
- GitNexus impact for `ProblemBrief`: HIGH risk, 1 direct caller, 3 affected processes: `ProblemWorkspace`, `PracticeWorkspace`, and `Practice`.
- GitNexus impact for `ProblemWorkspace`, `PracticeWorkspace`, `Practice`, `buildStructuredPracticeProblemInsert`, `buildPracticeGenerationPlan`, and `planPracticeSession` returned LOW risk.
- Focused verification: `npx vitest run tests\lib\practice-generation-plan.test.ts tests\lib\practice-structured-problem.test.ts tests\lib\practice-problem-view.test.ts tests\lib\practice-event-model.test.ts` passed with 21 tests.
- Related verification: `npx vitest run tests\lib\practice-generation-plan.test.ts tests\lib\practice-structured-problem.test.ts tests\lib\practice-problem-view.test.ts tests\lib\practice-run-output-view.test.ts tests\lib\practice-event-model.test.ts tests\lib\practice-test-execution.test.ts tests\lib\practice-test-harness.test.ts` passed with 43 tests.
- Scoped lint verification: `npx eslint src\lib\practice-generation-plan.server.ts src\lib\practice-structured-problem.server.ts src\lib\practice-problem-view.ts src\routes\_authenticated\practice.tsx src\integrations\supabase\types.ts tests\lib\practice-generation-plan.test.ts tests\lib\practice-structured-problem.test.ts tests\lib\practice-problem-view.test.ts tests\lib\practice-event-model.test.ts` passed.

Session 6 evidence:

- Started the local app at `http://127.0.0.1:5177` with `npm run dev -- --host 127.0.0.1 --port 5177`; the root route returned HTTP 200.
- Browser-checked `/practice` unauthenticated at 1440x900 and 390x844. It correctly redirected to `/login`, and both viewports reported no horizontal overflow.
- Browser-checked the authenticated practice shell with a local fake Supabase session at 1440x900 and 390x844. The topic step rendered with no horizontal overflow in both viewports.
- Browser-checked the mobile authenticated shell menu at 390x844. Dashboard, Review Code, Practice, Settings, Billing, and Sign out navigation rendered with no horizontal overflow.
- Screenshot evidence was saved under `test-results/day4-session6-practice-*.png` for the redirect, fake-auth shell, and mobile menu passes.
- Added `tests/e2e/practice-workspace.spec.ts` to browser-check the real authenticated `/practice` route with a route-compatible fake Supabase session, Supabase REST stubs, and TanStack server-function mocks that return the required `{ result, context }` middleware envelope.
- Browser-checked the full practice problem workspace at 1440x900: structured problem brief, visible-test count, editor typing, reset behavior, mocked visible-test run output, and problem-list navigation.
- Browser-checked the full practice problem workspace at 390x844: problem-list navigation, editor visibility, run-test control visibility, and horizontal overflow metrics.
- Focused e2e verification: `$env:CODEWISE_URL='http://127.0.0.1:5177'; npx playwright test tests/e2e/practice-workspace.spec.ts --project=chromium --workers=1` passed with 2 tests.
- Scoped lint verification: `npx eslint tests\e2e\practice-workspace.spec.ts` passed.
- Full verification: `npm test` passed with 176 tests and 3 skipped tests. Existing `tests/lib/ai-workflow.test.ts` stderr covered rate-limit and malformed-JSON retry fixtures.
- Build verification: `npm run build` passed with the existing Lovable context notice, large-chunk warning, and TanStack unused-import warnings.
- GitNexus detect-changes with `--scope staged` reported LOW risk across 5 indexed files and 7 markdown symbols, with 0 affected processes.
- GitNexus detect-changes with `--scope staged` reported HIGH risk across 16 files and 34 symbols, affecting 11 execution flows. The affected scope is expected because planner metadata, structured inserts, the practice view model, and the practice route all feed generated practice problem flows.

## Day 5: Mastery Analytics

1. ✅ Add event logging for generation, visible test runs, hidden test checks, hint usage, submissions, completion, and review quality.
2. ✅ Build derived mastery scoring from correctness, attempts, hint usage, review quality, speed as secondary, and repeat performance.
3. Update mastery across the primary topic plus prerequisite topics.
4. Add conservative hidden-test contribution so hidden tests do not become the sole pass/fail gate.
5. Update dashboard and practice surfaces to show mastery band and next recommended curriculum node.
6. Add tests for mastery deltas, prerequisite updates, repeated attempts, and spaced review confirmation.

Session 1 evidence:

- Extended the practice event contract with typed events for problem generation, visible-test runs, hint reveals, hidden-test checks, submitted attempts, completed problems, and review-quality records.
- Added `src/lib/practice-event-log.server.ts` so authenticated server functions and route-triggered events share the same Supabase `practice_events` row mapping.
- `generatePractice` now records a best-effort generation event after the structured problem and hidden tests are stored.
- `submitPracticeAttempt` now stores speed seconds and review-quality score on `practice_attempts`, then records hidden-check, submission, completion, and review-quality events without storing hidden test content in event payloads.
- The practice workspace now records visible-test run summaries and includes optional review notes for complexity and edge cases before submit.
- Added event-model tests covering all Day 5 Session 1 event shapes and review-quality scoring.
- Focused lint passed for the touched source and test files.
- Full unit verification: `npm test` passed with 181 tests and 3 skipped tests. Existing `tests/lib/ai-workflow.test.ts` stderr covered rate-limit and malformed-JSON retry fixtures.
- Build verification: `npm run build` passed with the existing Lovable context notice, large-chunk warning, and TanStack unused-import warnings.
- Browser verification: `$env:CODEWISE_URL='http://127.0.0.1:5177'; npx playwright test tests/e2e/practice-workspace.spec.ts --project=chromium --workers=1` passed with 2 tests.

Session 2 evidence:

- Added `src/lib/practice-mastery-scoring.ts` as a pure derived mastery scoring module.
- The score combines correctness, failed attempt count, hint usage, review quality, repeat performance, and speed with speed capped as a secondary signal.
- Added conservative mastery deltas: visible-complete attempts can grow mastery, repeated attempts and hints reduce the gain, near-pass failures do not lose mastery, and low-correctness failures only apply a small penalty.
- Added `src/lib/practice-mastery-progress.server.ts` to read the existing `progress` row and upsert derived mastery, attempts, review scheduling, stability, difficulty, and retrievability without a new migration.
- Updated `submitPracticeAttempt` to count failed attempts for the same practice problem, save the attempt, record analytics events, then update primary-topic progress with the derived mastery result.
- Supabase changelog was checked; no new table or Data API exposure work is required because this session reuses the existing `progress` table and RLS policy.
- GitNexus impact for `submitPracticeAttempt`: LOW risk, 0 direct callers, 0 affected processes.
- GitNexus impact for `buildConservativePracticeAttemptScore`: LOW risk, 0 direct callers, 0 affected processes.
- GitNexus impact for `updateFSRS`: LOW risk, 1 direct caller, 1 affected process: `reviewCode`. This session did not modify `updateFSRS`.
- Focused verification: `npx vitest run tests\lib\practice-mastery-scoring.test.ts` passed with 7 tests.
- Related verification: `npx vitest run tests\lib\practice-mastery-scoring.test.ts tests\lib\practice-attempt-scoring.test.ts tests\lib\practice-event-model.test.ts` passed with 20 tests.
- Scoped lint verification: `npx eslint src\lib\practice-mastery-scoring.ts src\lib\practice-mastery-progress.server.ts src\lib\practice-attempt.functions.ts tests\lib\practice-mastery-scoring.test.ts` passed.
- Full verification: `npm test` passed with 188 tests and 3 skipped tests. Existing `tests/lib/ai-workflow.test.ts` stderr covered rate-limit and malformed-JSON retry fixtures.
- Build verification: `npm run build` passed with the existing Lovable context notice, large-chunk warning, and TanStack unused-import warnings.

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
