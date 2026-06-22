import { describe, it, expect } from "vitest";
import {
  LANGS,
  VALID_TOPIC_SLUGS,
  ReviewIssueSchema,
  ReviewResponseSchema,
  SYSTEM_PROMPT,
} from "@/lib/review.constants";

// ---------------------------------------------------------------------------
// LANGS — supported languages constant
// ---------------------------------------------------------------------------

describe("LANGS", () => {
  it("contains exactly 5 supported languages", () => {
    expect(LANGS).toHaveLength(5);
  });

  it("includes python, javascript, java, cpp, and go", () => {
    expect(LANGS).toContain("python");
    expect(LANGS).toContain("javascript");
    expect(LANGS).toContain("java");
    expect(LANGS).toContain("cpp");
    expect(LANGS).toContain("go");
  });
});

// ---------------------------------------------------------------------------
// VALID_TOPIC_SLUGS — valid CS concept slugs
// ---------------------------------------------------------------------------

describe("VALID_TOPIC_SLUGS", () => {
  it("contains exactly 20 valid topic slugs", () => {
    expect(VALID_TOPIC_SLUGS.size).toBe(20);
  });

  it("includes fundamental CS topics", () => {
    expect(VALID_TOPIC_SLUGS.has("arrays")).toBe(true);
    expect(VALID_TOPIC_SLUGS.has("strings")).toBe(true);
    expect(VALID_TOPIC_SLUGS.has("hashing")).toBe(true);
    expect(VALID_TOPIC_SLUGS.has("dp")).toBe(true);
    expect(VALID_TOPIC_SLUGS.has("graphs")).toBe(true);
    expect(VALID_TOPIC_SLUGS.has("complexity")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(VALID_TOPIC_SLUGS.has("nonexistent-topic")).toBe(false);
    expect(VALID_TOPIC_SLUGS.has("")).toBe(false);
    expect(VALID_TOPIC_SLUGS.has("machine-learning")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SYSTEM_PROMPT — constant string for AI review
// ---------------------------------------------------------------------------

describe("SYSTEM_PROMPT", () => {
  it("is a non-empty string", () => {
    expect(typeof SYSTEM_PROMPT).toBe("string");
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("contains reference to CodeWise", () => {
    expect(SYSTEM_PROMPT).toContain("CodeWise");
  });

  it("mentions severity levels (error, warning, info)", () => {
    expect(SYSTEM_PROMPT).toContain("error");
    expect(SYSTEM_PROMPT).toContain("warning");
    expect(SYSTEM_PROMPT).toContain("info");
  });
});

// ---------------------------------------------------------------------------
// ReviewIssueSchema — Zod schema for an individual review issue
// ---------------------------------------------------------------------------

describe("ReviewIssueSchema", () => {
  it("validates the minimum required fields (title + explanation)", () => {
    const result = ReviewIssueSchema.safeParse({
      title: "Null pointer",
      explanation: "This can cause a crash",
    });
    expect(result.success).toBe(true);
  });

  it("applies default severity of 'info' when not provided", () => {
    const result = ReviewIssueSchema.parse({
      title: "Style issue",
      explanation: "Use const",
    });
    expect(result.severity).toBe("info");
  });

  it("accepts explicit severity 'error'", () => {
    const result = ReviewIssueSchema.safeParse({
      title: "Memory leak",
      explanation: "Forgot to free",
      severity: "error",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.severity).toBe("error");
  });

  it("accepts severity 'warning'", () => {
    const result = ReviewIssueSchema.safeParse({
      title: "Unused variable",
      explanation: "x is declared but not used",
      severity: "warning",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.severity).toBe("warning");
  });

  it("rejects invalid severity values", () => {
    const result = ReviewIssueSchema.safeParse({
      title: "Bad",
      explanation: "Something",
      severity: "critical",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = ReviewIssueSchema.safeParse({
      title: "",
      explanation: "Whatever",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields (line, concept_slug, fix_hint, is_correct_pattern)", () => {
    const result = ReviewIssueSchema.safeParse({
      title: "Deep nesting",
      explanation: "Too many levels of indentation",
      line: 42,
      concept_slug: "complexity",
      fix_hint: "Extract into a helper function",
      is_correct_pattern: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.line).toBe(42);
      expect(result.data.concept_slug).toBe("complexity");
      expect(result.data.fix_hint).toBe("Extract into a helper function");
      expect(result.data.is_correct_pattern).toBe(false);
    }
  });

  it("allows null for concept_slug and fix_hint", () => {
    const result = ReviewIssueSchema.safeParse({
      title: "General issue",
      explanation: "No specific concept",
      concept_slug: null,
      fix_hint: null,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ReviewResponseSchema — Zod schema for the full AI review response
// ---------------------------------------------------------------------------

describe("ReviewResponseSchema", () => {
  it("validates with summary only (concepts and issues default to empty arrays)", () => {
    const result = ReviewResponseSchema.safeParse({
      summary: "Good code overall.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.summary).toBe("Good code overall.");
      expect(result.data.concepts).toEqual([]);
      expect(result.data.issues).toEqual([]);
    }
  });

  it("validates a full response with concepts and issues", () => {
    const result = ReviewResponseSchema.safeParse({
      summary: "Decent solution but O(n^2).",
      concepts: ["arrays", "complexity"],
      issues: [
        {
          title: "Nested loops",
          explanation: "Causes quadratic time complexity",
          severity: "warning",
          concept_slug: "complexity",
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.concepts).toHaveLength(2);
      expect(result.data.issues).toHaveLength(1);
    }
  });

  it("rejects missing summary", () => {
    const result = ReviewResponseSchema.safeParse({
      concepts: ["arrays"],
    });
    expect(result.success).toBe(false);
  });

  it("allows extra unknown properties via passthrough", () => {
    const result = ReviewResponseSchema.safeParse({
      summary: "Works.",
      extra_field: "unexpected",
      another_field: 123,
    });
    expect(result.success).toBe(true);
    // passthrough should include the extra fields
    if (result.success) {
      expect((result.data as any).extra_field).toBe("unexpected");
      expect((result.data as any).another_field).toBe(123);
    }
  });
});
