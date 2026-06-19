# CodeWise Product Improvement Plan

## Evidence
- Live app inspected at `http://127.0.0.1:5175`.
- Routes checked with Playwright fallback: `/`, `/learn`, `/blog`, `/pricing`, `/login`, `/signup`, `/review`, `/practice`, `/learn/arrays`, `/learn/hash-tables`, `/forgot-password`.
- Screenshots generated in `mesh/notes/playwright-*.png`.
- Playwright MCP browser setup failed twice with `CreateProcessAsUserW failed: 5`; local Playwright Chromium inspection succeeded after approval.
- Agent Mesh judges completed: DSA teacher, student, and senior developer.

## Current Strengths
- The landing page communicates the main product idea clearly: code review tied to DSA concepts, mastery tracking, and targeted practice.
- Public topic pages provide a useful topic hub and foundational vocabulary.
- Authenticated source shows a credible MVP loop: review code, identify weak concepts, generate practice, track mastery, and run code.
- Protected routes redirected to login during live Playwright inspection.

## Priority 1: Fix Trust And Conversion Breaks
1. Fix pricing plan inconsistency.
   Free currently shows `25 practice problems / day`, while Pro shows `15 practice problems / day`. This makes paid look worse.
2. Align trial copy.
   The homepage says the first review is free, while pricing says 50 reviews per month. Pick one clear free-tier promise.
3. Add a public demo review path.
   Let a student paste a small code snippet and see a limited sample review before account creation.
4. Add visible reliability and privacy signals near signup.
   Clarify what happens to submitted code, model limits, and whether data is used for research or product improvement.

## Priority 2: Tighten The Learning System
1. Unify topic slugs across learn, review, practice, graph, and database-backed progress.
   Examples found: `dynamic-programming` vs `dp`, `hash-tables` vs `hashing`, `binary-search-trees` vs `bst`.
2. Expand learn pages from reference notes into teaching pages.
   Add worked examples, trace tables, common mistakes, quick checks, and links to practice for the same canonical topic.
3. Strengthen practice generation.
   Require examples, constraints, expected outputs, misconception focus, and a rubric in generated problems.
4. Connect due review topics to micro-lessons.
   When spaced repetition says a topic is due, show a short retrieval task or worked mistake before generating a new problem.

## Priority 3: Improve Product Completeness
1. Replace the empty blog state with 3 to 5 seeded articles or hide Blog until content exists.
2. Improve empty auth form feedback.
   Empty login/signup submissions did not show visible validation in the captured page text.
3. Improve dashboard onboarding after login.
   The public pages sell mastery tracking, but users need an obvious first-task path after account creation.
4. Make topic cards more actionable.
   Add examples of problems or mistakes per topic so Learn does not feel static.

## Priority 4: Fix Technical Polish
1. Update CSP to allow Plausible or remove the Plausible script in environments where it is blocked.
   Browser console repeatedly reported CSP blocking `https://plausible.io/js/script.js`.
2. Clean quota copy.
   `practice.functions.ts` uses `roadmap / day`, which should say practice problems.
3. Audit encoding and banned punctuation in user-facing source text.
   Some existing files include em dashes and encoding artifacts.
4. Run the critical browser suite on `127.0.0.1:5175`.
   Include homepage, pricing, signup, login, topic page, protected route redirect, and mobile nav.

## Suggested Implementation Order
1. Pricing and copy cleanup.
2. Canonical topic slug map and redirects or aliases.
3. Public demo review.
4. Learn page teaching depth.
5. Practice generation rubric and validation.
6. CSP and browser regression tests.

## Open Risks
- Authenticated product value was partly judged from source because no test account was provided.
- Playwright MCP browser could not start in this Windows sandbox, so inspection used installed Playwright as a fallback.
- No product code was changed as part of this planning pass.
