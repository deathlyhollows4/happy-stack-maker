import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildPracticeExecutionFailure,
  buildPracticeVisibleTestWrapper,
  normalizePracticeExecutionResult,
  parsePracticeTestRunOutput,
  type PracticeExecutionSummary,
} from "@/lib/practice-test-execution";
import type { PracticeTestWrapper } from "@/lib/practice-test-wrappers";
import type {
  PracticeProblemLanguage,
  PracticeProblemTestCase,
} from "@/lib/practice-problem-contract";

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

const BEGINNER_LANGUAGE_FIXTURES: Array<{
  language: PracticeProblemLanguage;
  functionName: string;
  userCode: string;
  filename: string;
  callFragment: string;
}> = [
  {
    language: "python",
    functionName: "count_positive",
    userCode:
      "def count_positive(nums):\n    count = 0\n    for value in nums:\n        if value > 0:\n            count += 1\n    return count",
    filename: "main.py",
    callFragment: 'count_positive(*__case["arguments"])',
  },
  {
    language: "javascript",
    functionName: "countPositive",
    userCode:
      "export function countPositive(nums) {\n  let count = 0;\n  for (const value of nums) {\n    if (value > 0) count += 1;\n  }\n  return count;\n}",
    filename: "main.js",
    callFragment: 'eval("countPositive")',
  },
  {
    language: "java",
    functionName: "countPositive",
    userCode:
      "public static int countPositive(int[] nums) {\n    int count = 0;\n    for (int value : nums) {\n      if (value > 0) count++;\n    }\n    return count;\n  }",
    filename: "Main.java",
    callFragment: "countPositive(new int[]{-1, 2, 0, 4})",
  },
  {
    language: "cpp",
    functionName: "countPositive",
    userCode:
      "int countPositive(vector<int> nums) {\n  int count = 0;\n  for (int value : nums) {\n    if (value > 0) count++;\n  }\n  return count;\n}",
    filename: "main.cpp",
    callFragment: "countPositive(vector<int>{-1, 2, 0, 4})",
  },
  {
    language: "go",
    functionName: "CountPositive",
    userCode:
      "func CountPositive(nums []int) int {\n  count := 0\n  for _, value := range nums {\n    if value > 0 {\n      count++\n    }\n  }\n  return count\n}",
    filename: "main.go",
    callFragment: "CountPositive([]int{-1, 2, 0, 4})",
  },
];

function hasCommand(command: string, args: string[] = ["--version"]) {
  try {
    execFileSync(command, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const AVAILABLE_EXECUTION_LANGUAGES = new Set<PracticeProblemLanguage>(
  BEGINNER_LANGUAGE_FIXTURES.filter(({ language }) => {
    switch (language) {
      case "python":
        return hasCommand("python", ["--version"]);
      case "javascript":
        return hasCommand("node", ["--version"]);
      case "java":
        return hasCommand("javac", ["-version"]) && hasCommand("java", ["-version"]);
      case "cpp":
        return hasCommand("g++", ["--version"]);
      case "go":
        return hasCommand("go", ["version"]);
    }
  }).map(({ language }) => language),
);

function executeWrapper(wrapper: PracticeTestWrapper) {
  const directory = mkdtempSync(path.join(tmpdir(), "codewise-harness-"));
  const filePath = path.join(directory, wrapper.filename);
  writeFileSync(filePath, wrapper.code);

  try {
    switch (wrapper.language) {
      case "python":
        return execFileSync("python", [filePath], { cwd: directory, encoding: "utf8" });
      case "javascript":
        return execFileSync("node", [filePath], { cwd: directory, encoding: "utf8" });
      case "java":
        execFileSync("javac", [filePath], { cwd: directory, stdio: "pipe" });
        return execFileSync("java", ["Main"], { cwd: directory, encoding: "utf8" });
      case "cpp": {
        const binaryPath = path.join(directory, "main.exe");
        execFileSync("g++", [filePath, "-std=c++17", "-o", binaryPath], {
          cwd: directory,
          stdio: "pipe",
        });
        return execFileSync(binaryPath, { cwd: directory, encoding: "utf8" });
      }
      case "go":
        return execFileSync("go", ["run", filePath], { cwd: directory, encoding: "utf8" });
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function expectPassedSummary(summary: PracticeExecutionSummary) {
  expect(summary).toEqual({
    total: 2,
    passed: 2,
    failed: 0,
    status: "passed",
  });
}

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

  it.each(BEGINNER_LANGUAGE_FIXTURES)(
    "builds the same beginner visible-test harness for $language",
    ({ language, functionName, userCode, filename, callFragment }) => {
      const wrapper = buildPracticeVisibleTestWrapper({
        language,
        functionName,
        userCode,
        visibleTests: VISIBLE_TESTS,
      });

      expect(wrapper).toMatchObject({
        language,
        filename,
        testCount: 2,
      });
      expect(wrapper.code).toContain("visible-1-empty-array");
      expect(wrapper.code).toContain("visible-2-mixed-values");
      expect(wrapper.code).toContain(callFragment);
      expect(wrapper.code).toContain("codewiseTestResults");
    },
  );

  it.each(
    BEGINNER_LANGUAGE_FIXTURES.filter(({ language }) =>
      AVAILABLE_EXECUTION_LANGUAGES.has(language),
    ),
  )(
    "executes the beginner visible-test harness for $language",
    (fixture) => {
      const wrapper = buildPracticeVisibleTestWrapper({
        language: fixture.language,
        functionName: fixture.functionName,
        userCode: fixture.userCode,
        visibleTests: VISIBLE_TESTS,
      });
      const stdout = executeWrapper(wrapper);
      const normalized = normalizePracticeExecutionResult({
        stdout,
        stderr: "",
        compileStderr: "",
        exitCode: 0,
      });

      expectPassedSummary(normalized.testSummary);
      expect(normalized.testResults?.map((result) => result.name)).toEqual([
        "empty array",
        "mixed values",
      ]);
    },
    30_000,
  );

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

  it("normalizes wrong answers when a test result does not match expected output", () => {
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
      status: "wrong_answer",
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

  it("normalizes runtime errors captured by an individual test wrapper", () => {
    const normalized = normalizePracticeExecutionResult({
      stdout:
        '{"codewiseTestResults":[{"id":"visible-1","name":"case","visibility":"visible","passed":false,"actual":null,"expected":2,"error":"ZeroDivisionError"}]}',
      stderr: "",
      compileStderr: "",
      exitCode: 0,
    });

    expect(normalized.testSummary).toMatchObject({
      total: 1,
      passed: 0,
      failed: 1,
      status: "runtime_error",
    });
  });

  it("normalizes timeout signals before generic runtime errors", () => {
    const normalized = normalizePracticeExecutionResult({
      stdout: "",
      stderr: "execution timed out",
      compileStderr: "",
      exitCode: 1,
      runSignal: "SIGKILL",
    });

    expect(normalized.testSummary.status).toBe("timeout");
  });

  it("builds unsupported signature summaries without runnable test results", () => {
    const normalized = buildPracticeExecutionFailure({
      status: "unsupported_signature",
      total: 2,
      error: "This function signature is not supported by the test runner yet.",
    });

    expect(normalized).toEqual({
      testSummary: {
        total: 2,
        passed: 0,
        failed: 2,
        status: "unsupported_signature",
      },
      error: "This function signature is not supported by the test runner yet.",
    });
  });
});
