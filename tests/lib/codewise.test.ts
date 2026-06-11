import { describe, it, expect } from "vitest";
import { computeFSRSGrade, extractJson, updateFSRS } from "@/lib/codewise.functions";

// ---------------------------------------------------------------------------
// computeFSRSGrade — grades code review issues into 1-4 scale
// ---------------------------------------------------------------------------

describe("computeFSRSGrade", () => {
  it("returns grade 4 for clean code with 0 issues", () => {
    expect(computeFSRSGrade([])).toBe(4);
  });

  it("returns grade 4 for code with only info issues", () => {
    const issues = [
      { severity: "info", title: "Good use of map()" },
      { severity: "info", title: "Clean variable naming" },
    ];
    expect(computeFSRSGrade(issues)).toBe(4);
  });

  it("returns grade 1 for code with 2+ errors", () => {
    const issues = [
      { severity: "error", title: "Wrong time complexity" },
      { severity: "error", title: "Missing edge case" },
    ];
    expect(computeFSRSGrade(issues)).toBe(1);
  });

  it("returns grade 1 for code with syntax title keywords (string matching)", () => {
    const issues = [{ severity: "warning", title: "Syntax error detected" }];
    expect(computeFSRSGrade(issues)).toBe(1);
  });

  it("returns grade 1 for code with 'incorrect' title", () => {
    const issues = [{ severity: "warning", title: "Incorrect loop condition" }];
    expect(computeFSRSGrade(issues)).toBe(1);
  });

  it("returns grade 1 for code with 'wrong' title", () => {
    const issues = [{ severity: "warning", title: "Wrong data structure" }];
    expect(computeFSRSGrade(issues)).toBe(1);
  });

  it("returns grade 2 for code with 1 error only", () => {
    const issues = [{ severity: "error", title: "Null pointer risk" }];
    expect(computeFSRSGrade(issues)).toBe(2);
  });

  it("returns grade 2 for code with 3+ warnings (non-matching titles)", () => {
    const issues = [
      { severity: "warning", title: "Consider using const" },
      { severity: "warning", title: "Function too long" },
      { severity: "warning", title: "Deep nesting" },
    ];
    expect(computeFSRSGrade(issues)).toBe(2);
  });

  it("returns grade 3 for code with 1-2 warnings", () => {
    const issues = [
      { severity: "warning", title: "Consider type annotation" },
    ];
    expect(computeFSRSGrade(issues)).toBe(3);
  });

  it("returns grade 3 for code with 2 warnings", () => {
    const issues = [
      { severity: "warning", title: "Style" },
      { severity: "warning", title: "Naming" },
    ];
    expect(computeFSRSGrade(issues)).toBe(3);
  });

  it("handles mixed severity — errors dominate warnings", () => {
    // 1 error = grade 2 regardless of warnings
    const issues = [
      { severity: "error", title: "Null pointer" },
      { severity: "warning", title: "Style" },
      { severity: "warning", title: "Naming" },
      { severity: "warning", title: "Complexity" },
    ];
    expect(computeFSRSGrade(issues)).toBe(2);
  });

  it("case-insensitive title matching for syntax/incorrect/wrong", () => {
    const issues = [{ severity: "warning", title: "SYNTAX" }];
    expect(computeFSRSGrade(issues)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// extractJson — extracts JSON from markdown fences or raw text
// ---------------------------------------------------------------------------

describe("extractJson", () => {
  it("extracts from markdown fence with json tag", () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(JSON.parse(extractJson(input))).toEqual({ key: "value" });
  });

  it("extracts from bare markdown fence (no language tag)", () => {
    const input = '```\n{"key": "value"}\n```';
    expect(JSON.parse(extractJson(input))).toEqual({ key: "value" });
  });

  it("extracts from inline braces when no fence exists", () => {
    const input = 'Some text {"key": "value"} more text';
    expect(JSON.parse(extractJson(input))).toEqual({ key: "value" });
  });

  it("extracts from braces with surrounding prose", () => {
    const input = 'Here is the result:\n{\n  "summary": "Good job",\n  "concepts": ["arrays"]\n}\nHope this helps.';
    const result = JSON.parse(extractJson(input));
    expect(result.summary).toBe("Good job");
    expect(result.concepts).toEqual(["arrays"]);
  });

  it("extracts from first brace to last brace with nested objects", () => {
    const input = '{\n  "outer": {\n    "inner": "value"\n  }\n}';
    expect(JSON.parse(extractJson(input))).toEqual({ outer: { inner: "value" } });
  });

  it("returns raw input when no braces or fences found", () => {
    const input = "plain text without any JSON";
    expect(extractJson(input)).toBe(input);
  });

  it("trims whitespace before processing", () => {
    const input = '  \n  {"key": "value"}  \n  ';
    expect(JSON.parse(extractJson(input))).toEqual({ key: "value" });
  });

  it("handles empty input", () => {
    expect(extractJson("")).toBe("");
  });

  it("handles null-ish placeholder like '{}'", () => {
    expect(extractJson("{}")).toBe("{}");
  });

  it("extracts from multi-line fence with leading/trailing whitespace", () => {
    const input = '\n\n```json\n{\n  "concepts": ["arrays", "hashing"]\n}\n```\n\n';
    const result = JSON.parse(extractJson(input));
    expect(result.concepts).toHaveLength(2);
    expect(result.concepts).toContain("arrays");
  });

  it("picks the outer-most fence when multiple exist", () => {
    const input = '```json\n{"first": true}\n```\nSome text\n```json\n{"second": true}\n```';
    const result = JSON.parse(extractJson(input));
    expect(result).toEqual({ first: true });
  });
});

// ---------------------------------------------------------------------------
// updateFSRS — skipped: requires Supabase DB mock (integration test)
// ---------------------------------------------------------------------------

describe.skip("updateFSRS", () => {
  it("computes proper interval growth with consecutive Easy grades", () => {
    // Integration test: requires supabaseAdmin mock
    // After fix: S=2.5, grade=4 => interval ~3 days
    // After fix: 5x grade=4 => interval 60+ days
    expect(true).toBe(true);
  });

  it("handles grade 1 (failure) by halving stability", () => {
    // S=2.5, grade=1 => newStability=1.25, interval=1 day
    expect(true).toBe(true);
  });

  it("does not apply grade uniformly across concepts", () => {
    // C2 fix: per-concept grading
    expect(true).toBe(true);
  });
});
