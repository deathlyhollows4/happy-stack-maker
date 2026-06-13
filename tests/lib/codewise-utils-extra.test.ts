import { describe, it, expect } from "vitest";
import {
  extractJson,
  computeFSRSGrade,
  FSRS_WEIGHTS,
} from "@/lib/codewise.utils";

// ---------------------------------------------------------------------------
// FSRS_WEIGHTS — constant array used in spaced repetition algorithm
// ---------------------------------------------------------------------------

describe("FSRS_WEIGHTS", () => {
  it("has exactly 10 elements", () => {
    expect(FSRS_WEIGHTS).toHaveLength(10);
  });

  it("all values are finite positive numbers", () => {
    for (const w of FSRS_WEIGHTS) {
      expect(typeof w).toBe("number");
      expect(Number.isFinite(w)).toBe(true);
      expect(w).toBeGreaterThan(0);
    }
  });

  it("values match known FSRS-5 defaults", () => {
    // Standard FSRS-5 parameter set
    expect(FSRS_WEIGHTS[0]).toBeCloseTo(0.4);
    expect(FSRS_WEIGHTS[1]).toBeCloseTo(0.6);
    expect(FSRS_WEIGHTS[2]).toBeCloseTo(2.4);
    expect(FSRS_WEIGHTS[3]).toBeCloseTo(5.8);
    expect(FSRS_WEIGHTS[4]).toBeCloseTo(4.9);
    expect(FSRS_WEIGHTS[5]).toBeCloseTo(0.9);
  });
});

// ---------------------------------------------------------------------------
// computeFSRSGrade — additional edge cases beyond existing test suite
// ---------------------------------------------------------------------------

describe("computeFSRSGrade — extra edge cases", () => {
  it("returns grade 4 for info-only issues after error keywords are absent", () => {
    const issues = [
      { severity: "info", title: "Clean naming convention" },
      { severity: "info", title: "Proper use of const" },
    ];
    expect(computeFSRSGrade(issues)).toBe(4);
  });

  // H12: string matching removed — severity count only
  it("grade based on severity count, not keyword in title", () => {
    const issues = [{ severity: "info", title: "Potential syntax improvement here" }];
    expect(computeFSRSGrade(issues)).toBe(4); // 0 errors, 0 warnings = grade 4
  });

  it("grade by severity, not substring in title", () => {
    const issues = [{ severity: "warning", title: "You chose the wrong approach here" }];
    expect(computeFSRSGrade(issues)).toBe(3); // 1 warning = grade 3
  });

  it("empty issues array returns grade 4", () => {
    expect(computeFSRSGrade([])).toBe(4);
  });

  it("exactly 3 warnings with no keyword triggers → grade 2", () => {
    const issues = [
      { severity: "warning", title: "Too long" },
      { severity: "warning", title: "Too complex" },
      { severity: "warning", title: "Deep nesting" },
    ];
    expect(computeFSRSGrade(issues)).toBe(2);
  });

  it("exactly 2 warnings → grade 3", () => {
    const issues = [
      { severity: "warning", title: "Style" },
      { severity: "warning", title: "Naming" },
    ];
    expect(computeFSRSGrade(issues)).toBe(3);
  });

  it("1 error alone returns grade 2", () => {
    expect(computeFSRSGrade([
      { severity: "error", title: "Off-by-one" },
    ])).toBe(2);
  });

  it("mixed severity with 1 error + many warnings → still grade 2", () => {
    const issues = [
      { severity: "error", title: "Memory leak" },
      { severity: "warning", title: "Style" },
      { severity: "warning", title: "Naming" },
      { severity: "warning", title: "Complex" },
      { severity: "warning", title: "Nesting" },
    ];
    expect(computeFSRSGrade(issues)).toBe(2);
  });

  it("1 error = grade 2 regardless of keyword in title", () => {
    const issues = [
      { severity: "error", title: "Syntax error in function call" },
    ];
    expect(computeFSRSGrade(issues)).toBe(2); // 1 error = grade 2
  });
});

// ---------------------------------------------------------------------------
// extractJson — additional edge cases beyond existing test suite
// ---------------------------------------------------------------------------

describe("extractJson — extra edge cases", () => {
  it("extracts JSON array from text", () => {
    const input = '["one", "two", "three"]';
    expect(JSON.parse(extractJson(input))).toEqual(["one", "two", "three"]);
  });

  it("extracts JSON array from markdown fence", () => {
    const input = '```json\n["a", "b"]\n```';
    expect(JSON.parse(extractJson(input))).toEqual(["a", "b"]);
  });

  it("handles JSON with escaped characters inside", () => {
    const input = '{"message": "Hello\\nWorld", "path": "C:\\\\Users"}';
    const result = JSON.parse(extractJson(input));
    expect(result.message).toBe("Hello\nWorld");
    expect(result.path).toBe("C:\\Users");
  });

  it("extracts JSON where braces are alongside other brackets", () => {
    const input = 'Text [info] {"key": [1, 2, 3]} trailing';
    const result = JSON.parse(extractJson(input));
    expect(result.key).toEqual([1, 2, 3]);
  });

  it("handles JSON containing markdown backtick characters", () => {
    // JSON value contains backticks but the outer structure is fence
    const input = '```\n{"code": "`const x = 1`"}\n```';
    expect(JSON.parse(extractJson(input))).toEqual({ code: "`const x = 1`" });
  });

  it("handles boolean and number primitives in JSON", () => {
    const input = '{"valid": true, "count": 42, "ratio": 0.5}';
    const result = JSON.parse(extractJson(input));
    expect(result.valid).toBe(true);
    expect(result.count).toBe(42);
    expect(result.ratio).toBe(0.5);
  });

  it("handles deeply nested JSON structures", () => {
    const input = '{"level1": {"level2": {"level3": {"value": "deep"}}}}';
    const result = JSON.parse(extractJson(input));
    expect(result.level1.level2.level3.value).toBe("deep");
  });
});
