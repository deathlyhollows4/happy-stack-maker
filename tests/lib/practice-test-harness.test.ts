import { describe, expect, it } from "vitest";
import {
  PRACTICE_TEST_CASE_TIMEOUT_MS,
  normalizePracticeProblemTestCases,
  parsePracticeHarnessTestCases,
  validatePracticeHarnessTestCases,
} from "@/lib/practice-test-harness";
import type { PracticeProblemTestCase } from "@/lib/practice-problem-contract";

function generatedVisibleTest(): PracticeProblemTestCase {
  return {
    name: "mixed values",
    arguments: [[-1, 2, 0, 4]],
    expected: 2,
    theme: "mixed values",
    comparator: "deepEqual",
    visibility: "visible",
  };
}

describe("PracticeHarnessTestCaseSchema", () => {
  it("accepts language-agnostic test cases with input, expected output, comparator, timeout, and visibility", () => {
    const parsed = parsePracticeHarnessTestCases([
      {
        id: "visible-1-mixed-values",
        name: "mixed values",
        input: {
          arguments: [[-1, 2, 0, 4]],
        },
        expectedOutput: 2,
        comparator: "deepEqual",
        timeoutMs: 3_000,
        visibility: "visible",
      },
    ]);

    expect(parsed[0]).toMatchObject({
      id: "visible-1-mixed-values",
      expectedOutput: 2,
      timeoutMs: 3_000,
      visibility: "visible",
    });
  });

  it("normalizes generated problem tests into harness test cases", () => {
    const testCases = normalizePracticeProblemTestCases([generatedVisibleTest()]);

    expect(testCases).toEqual([
      {
        id: "visible-1-mixed-values",
        name: "mixed values",
        input: {
          arguments: [[-1, 2, 0, 4]],
        },
        expectedOutput: 2,
        comparator: "deepEqual",
        timeoutMs: PRACTICE_TEST_CASE_TIMEOUT_MS.default,
        visibility: "visible",
      },
    ]);
  });

  it("keeps hidden visibility when normalizing hidden generated tests", () => {
    const hiddenTest: PracticeProblemTestCase = {
      ...generatedVisibleTest(),
      name: "empty list",
      arguments: [[]],
      expected: 0,
      theme: "empty list",
      visibility: "hidden",
    };

    const testCases = normalizePracticeProblemTestCases([hiddenTest], 5_000);

    expect(testCases[0]).toMatchObject({
      id: "hidden-1-empty-list",
      timeoutMs: 5_000,
      visibility: "hidden",
    });
  });

  it("rejects cases without function arguments or stdin", () => {
    const result = validatePracticeHarnessTestCases([
      {
        id: "visible-1-empty",
        name: "empty",
        input: {},
        expectedOutput: 0,
        comparator: "deepEqual",
        timeoutMs: 3_000,
        visibility: "visible",
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues).toContain(
      "0.input.arguments: A test case needs function arguments or stdin input.",
    );
  });

  it("rejects unsupported timeout values and extra fields", () => {
    const result = validatePracticeHarnessTestCases([
      {
        id: "visible-1-mixed-values",
        name: "mixed values",
        input: {
          arguments: [[1, 2]],
        },
        expectedOutput: 2,
        comparator: "deepEqual",
        timeoutMs: PRACTICE_TEST_CASE_TIMEOUT_MS.max + 1,
        visibility: "visible",
        note: "extra field",
      },
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues).toContain(
      `0.timeoutMs: Number must be less than or equal to ${PRACTICE_TEST_CASE_TIMEOUT_MS.max}`,
    );
    expect(result.issues.some((issue) => issue.includes("Unrecognized key"))).toBe(true);
  });
});
