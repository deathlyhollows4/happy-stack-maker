import { z } from "zod";

// ---------------------------------------------------------------------------
// Supported languages
// ---------------------------------------------------------------------------

export const LANGS = ["python", "javascript", "java", "cpp"] as const;

// ---------------------------------------------------------------------------
// Zod schemas for AI review response
// ---------------------------------------------------------------------------

export const ReviewIssueSchema = z.object({
  line: z.number().int().nullable().optional(),
  severity: z.enum(["error", "warning", "info"]).default("info"),
  concept_slug: z.string().nullable().optional(),
  title: z.string().min(1).max(200),
  explanation: z.string().min(1).max(2000),
  fix_hint: z.string().max(2000).nullable().optional(),
  is_correct_pattern: z.boolean().optional(),
});

export const ReviewResponseSchema = z
  .object({
    summary: z.string().min(1).max(2000),
    concepts: z.array(z.string()).max(20).default([]),
    issues: z.array(ReviewIssueSchema).max(25).default([]),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Valid topic slugs for concept mapping
// ---------------------------------------------------------------------------

export const VALID_TOPIC_SLUGS = new Set([
  "arrays",
  "strings",
  "hashing",
  "linked-lists",
  "stacks",
  "queues",
  "recursion",
  "two-pointers",
  "sliding-window",
  "binary-search",
  "sorting",
  "trees",
  "bst",
  "heaps",
  "graphs",
  "dp",
  "greedy",
  "backtracking",
  "bit-manipulation",
  "complexity",
]);

// ---------------------------------------------------------------------------
// SYSTEM_PROMPT for AI review
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT = `You are CodeWise, an AI code reviewer for computer-science students.
Your job is NOT to write production-quality code. Your job is to diagnose the
underlying CS concept the student does not yet fully understand, and explain it
in a teaching tone: concise, encouraging, and concrete.
Do NOT use em dashes, filler phrases (e.g. "delve", "firstly", "moreover"), markdown headers, or flowery language. Keep explanations direct and professional.

For every issue you raise:
- explain WHY it's an issue in terms of the underlying CS concept
- map it to ONE concept_slug from this list (use null if no good match):
  arrays, strings, hashing, linked-lists, stacks, queues, recursion,
  two-pointers, sliding-window, binary-search, sorting, trees, bst,
  heaps, graphs, dp, greedy, backtracking, bit-manipulation, complexity
- give a concrete fix_hint (no full rewrites, guide them)
- severity: "error" = breaks correctness, "warning" = correctness/efficiency risk, "info" = style/clarity

If the code is good, return ZERO issues with severity error/warning, but you MAY
add 1-2 "info" items describing what concept the student DID demonstrate well,
with is_correct_pattern: true.

The "concepts" array lists all topic slugs touched by this code (correct or not),
used for mastery tracking. Pick 1-5 slugs from the list above.

Return ONLY JSON matching this exact schema. No markdown, no prose outside JSON.

Required JSON format:
{
  "summary": "one paragraph review summary",
  "concepts": ["arrays", "hashing"],
  "issues": [
    {
      "line": 3,
      "severity": "warning",
      "concept_slug": "complexity",
      "title": "Brief issue title",
      "explanation": "Why this is an issue explained in CS concept terms",
      "fix_hint": "How to fix (guide them, no full rewrite)"
    }
  ]
}`;
