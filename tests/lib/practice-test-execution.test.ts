import { describe, expect, it } from "vitest";
import {
  buildPracticeVisibleTestWrapper,
  normalizePracticeExecutionResult,
  parsePracticeTestRunOutput,
} from "@/lib/practice-test-execution";
import type { PracticeProblemTestCase } from "@/lib/practice-problem-contract";

const VISIBLE_TESTS: PracticeProblemTestCase[] = [
  {
    name: "empty array",
    arguments: [[]],
    expected: 0,
    theme: "empty input",
    comparator: "deepEqual",
    visibility: "visible",
  },
  {
    name: "mixed values",
    arguments: [[-1, 2, 0, 4]],
    expected: 2,
    theme: "positive counting",
    comparator: "deepEqual",
    visibility: "visible",
  },
];

describe("buildPracticeVisibleTestWrapper", () => {
  it("normalizes stored visible tests and builds a language wrapper", () => {
    const wrapper = buildPracticeVisibleTestWrapper({
      language: "python",
      functionName: "count_positive",
      userCode: "def count_positive(nums):\n    return 0",
      visibleTests: VISIBLE_TESTS,
    });

    expect(wrapper).toMatchObject({
      language: "python",
      filename: "main.py",
      testCount: 2,
    });
    expect(wrapper.code).toContain("visible-1-empty-array");
    expect(wrapper.code).toContain("visible-2-mixed-values");
  });

  it("builds a Go wrapper for the execution flow", () => {
    const wrapper = buildPracticeVisibleTestWrapper({
      language: "go",
      functionName: "CountPositive",
      userCode: "func CountPositive(nums []int) int {\n  return 0\n}",
      visibleTests: VISIBLE_TESTS,
    });

    expect(wrapper.filename).toBe("main.go");
    expect(wrapper.code).toContain("CountPositive([]int{})");
    expect(wrapper.code).toContain("CountPositive([]int{-1, 2, 0, 4})");
  });
});

describe("parsePracticeTestRunOutput", () => {
  it("parses the wrapper JSON payload from stdout", () => {
    const results = parsePracticeTestRunOutput(
      '{"codewiseTestResults":[{"id":"visible-1-empty","name":"empty","visibility":"visible","passed":true,"actual":0,"expected":0,"error":null}]}',
    );

    expect(results).toEqual([
      {
        id: "visible-1-empty",
        name: "empty",
        visibility: "visible",
        passed: true,
        actual: 0,
        expected: 0,
        error: null,
      },
    ]);
  });

  it("parses the last JSON payload when user code prints logs first", () => {
    const results = parsePracticeTestRunOutput(
      'debug line\n{"codewiseTestResults":[{"id":"visible-1","name":"case","visibility":"visible","passed":false,"actual":1,"expected":2,"error":null}]}',
    );

    expect(results?.[0]?.passed).toBe(false);
    expect(results?.[0]?.actual).toBe(1);
  });
});

describe("normalizePracticeExecutionResult", () => {
  it("returns a passed summary when all visible tests pass", () => {
    const normalized = normalizePracticeExecutionResult({
      stdout:
        '{"codewiseTestResults":[{"id":"visible-1","name":"case","visibility":"visible","passed":true,"actual":2,"expected":2,"error":null}]}',
      stderr: "",
      compileStderr: "",
      exitCode: 0,
    });

    expect(normalized.testSummary).toEqual({
      total: 1,
      passed: 1,
      failed: 0,
      status: "passed",
    });
  });

  it("returns a failed summary when any visible test fails", () => {
    const normalized = normalizePracticeExecutionResult({
      stdout:
        '{"codewiseTestResults":[{"id":"visible-1","name":"case","visibility":"visible","passed":false,"actual":1,"expected":2,"error":null}]}',
      stderr: "",
      compileStderr: "",
      exitCode: 0,
    });

    expect(normalized.testSummary).toMatchObject({
      total: 1,
      passed: 0,
      failed: 1,
      status: "failed",
    });
  });

  it("normalizes compile errors without test results", () => {
    const normalized = normalizePracticeExecutionResult({
      stdout: "",
      stderr: "",
      compileStderr: "Main.java:3: error: missing return statement",
      exitCode: 1,
    });

    expect(normalized.testResults).toBeUndefined();
    expect(normalized.testSummary.status).toBe("compile_error");
  });

  it("normalizes runtime errors without test results", () => {
    const normalized = normalizePracticeExecutionResult({
      stdout: "",
      stderr: "Traceback",
      compileStderr: "",
      exitCode: 1,
    });

    expect(normalized.testSummary.status).toBe("runtime_error");
  });
});
