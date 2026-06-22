import { describe, expect, it } from "vitest";
import { buildPracticeTestWrapper } from "@/lib/practice-test-wrappers";
import type { PracticeHarnessTestCase } from "@/lib/practice-test-harness";
import type { PracticeProblemLanguage } from "@/lib/practice-problem-contract";

const BASE_TEST_CASE: PracticeHarnessTestCase = {
  id: "visible-1-mixed-values",
  name: "mixed values",
  input: {
    arguments: [[-1, 2, 0, 4]],
  },
  expectedOutput: 2,
  comparator: "deepEqual",
  timeoutMs: 3_000,
  visibility: "visible",
};

function wrapperFor(
  language: PracticeProblemLanguage,
  userCode: string,
  functionName = "countPositive",
) {
  return buildPracticeTestWrapper({
    language,
    functionName,
    userCode,
    testCases: [BASE_TEST_CASE],
  });
}

describe("buildPracticeTestWrapper", () => {
  it("builds a Python wrapper that calls the selected function", () => {
    const wrapper = wrapperFor(
      "python",
      "def countPositive(nums):\n    return sum(1 for value in nums if value > 0)",
    );

    expect(wrapper).toMatchObject({
      language: "python",
      filename: "main.py",
      testCount: 1,
    });
    expect(wrapper.code).toContain("__codewise_tests");
    expect(wrapper.code).toContain('countPositive(*__case["arguments"])');
  });

  it("builds a JavaScript wrapper and removes starter export syntax", () => {
    const wrapper = wrapperFor(
      "javascript",
      "export function countPositive(nums) {\n  return nums.filter((value) => value > 0).length;\n}",
    );

    expect(wrapper.filename).toBe("main.js");
    expect(wrapper.code).toContain('const __codewiseFunction = eval("countPositive")');
    expect(wrapper.code).toContain("function countPositive(nums)");
    expect(wrapper.code).not.toContain("export function");
  });

  it("builds a Java wrapper with a Main class and typed array test inputs", () => {
    const wrapper = wrapperFor(
      "java",
      "public static int countPositive(int[] nums) {\n    int count = 0;\n    for (int value : nums) if (value > 0) count++;\n    return count;\n  }",
    );

    expect(wrapper.filename).toBe("Main.java");
    expect(wrapper.code).toContain("public class Main");
    expect(wrapper.code).toContain("countPositive(new int[]{-1, 2, 0, 4})");
    expect(wrapper.code).toContain('\\"codewiseTestResults\\"');
  });

  it("builds a C++ wrapper with vector test inputs", () => {
    const wrapper = wrapperFor(
      "cpp",
      "int countPositive(vector<int> nums) {\n  int count = 0;\n  for (int value : nums) if (value > 0) count++;\n  return count;\n}",
    );

    expect(wrapper.filename).toBe("main.cpp");
    expect(wrapper.code).toContain("#include <bits/stdc++.h>");
    expect(wrapper.code).toContain("countPositive(vector<int>{-1, 2, 0, 4})");
    expect(wrapper.code).toContain("vector<string> results");
  });

  it("builds a Go wrapper with slice test inputs", () => {
    const wrapper = wrapperFor(
      "go",
      "func countPositive(nums []int) int {\n  count := 0\n  for _, value := range nums { if value > 0 { count++ } }\n  return count\n}",
    );

    expect(wrapper.filename).toBe("main.go");
    expect(wrapper.code).toContain("package main");
    expect(wrapper.code).toContain("countPositive([]int{-1, 2, 0, 4})");
    expect(wrapper.code).toContain('"codewiseTestResults"');
  });

  it("rejects invalid function names before building a wrapper", () => {
    expect(() =>
      buildPracticeTestWrapper({
        language: "python",
        functionName: "count-positive",
        userCode: "def count_positive(nums):\n    return 0",
        testCases: [BASE_TEST_CASE],
      }),
    ).toThrow("Function name must be a valid identifier.");
  });
});
