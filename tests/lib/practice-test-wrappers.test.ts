import { describe, expect, it } from "vitest";
import { buildPracticeTestWrapper } from "@/lib/practice-test-wrappers";
import type { PracticeHarnessTestCase } from "@/lib/practice-test-harness";
import type {
  PracticeProblemLanguage,
  PracticeProblemLanguageSignature,
} from "@/lib/practice-problem-contract";

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

  it("builds a JavaScript wrapper from export default starter code", () => {
    const wrapper = wrapperFor(
      "javascript",
      "export default function countPositive(nums) {\n  return nums.filter((value) => value > 0).length;\n}",
    );

    expect(wrapper.code).toContain("function countPositive(nums)");
    expect(wrapper.code).not.toContain("export default");
    expect(wrapper.code).not.toContain("default function");
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

  it("builds a Java wrapper that serializes string arrays as JSON arrays", () => {
    const wrapper = buildPracticeTestWrapper({
      language: "java",
      functionName: "tags",
      userCode:
        'public static String[] tags(String value) {\n    return new String[]{value, "ok"};\n  }',
      testCases: [
        {
          id: "visible-1-string-array",
          name: "string array",
          input: {
            arguments: ["go"],
          },
          expectedOutput: ["go", "ok"],
          comparator: "deepEqual",
          timeoutMs: 3_000,
          visibility: "visible",
        },
      ],
    });

    expect(wrapper.code).toContain("static String __json(String[] values)");
    expect(wrapper.code).toContain("items.add(__json(value))");
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

  it("builds a Go wrapper that can represent a null expected value", () => {
    const wrapper = buildPracticeTestWrapper({
      language: "go",
      functionName: "firstOrNil",
      userCode: "func firstOrNil(nums []int) any {\n  return nil\n}",
      testCases: [
        {
          id: "visible-1-empty",
          name: "empty",
          input: {
            arguments: [[]],
          },
          expectedOutput: null,
          comparator: "deepEqual",
          timeoutMs: 3_000,
          visibility: "visible",
        },
      ],
    });

    expect(wrapper.code).toContain("var expected any = nil");
  });

  it("uses language-specific callable names from structured signatures", () => {
    const signatures: PracticeProblemLanguageSignature[] = [
      {
        language: "python",
        callableName: "sum_two",
        signature: "def sum_two(a: int, b: int) -> int:",
        starterCode: "def sum_two(a, b):\n    return a + b",
      },
      {
        language: "javascript",
        callableName: "sumTwo",
        signature: "function sumTwo(a, b) { }",
        starterCode: "export function sumTwo(a, b) {\n  return a + b;\n}",
      },
      {
        language: "java",
        callableName: "sumTwo",
        signature: "public static int sumTwo(int a, int b)",
        starterCode: "public static int sumTwo(int a, int b) {\n  return a + b;\n}",
      },
      {
        language: "cpp",
        callableName: "sum_two",
        signature: "int sum_two(int a, int b)",
        starterCode: "int sum_two(int a, int b) {\n  return a + b;\n}",
      },
      {
        language: "go",
        callableName: "SumTwo",
        signature: "func SumTwo(a int, b int) int",
        starterCode: "func SumTwo(a int, b int) int {\n  return a + b\n}",
      },
    ];

    const wrappers = signatures.map((signature) =>
      buildPracticeTestWrapper({
        language: signature.language,
        functionName: signature.callableName,
        userCode: signature.starterCode,
        testCases: [
          {
            ...BASE_TEST_CASE,
            id: `visible-1-${signature.language}`,
            input: {
              arguments: [2, 3],
            },
            expectedOutput: 5,
          },
        ],
      }),
    );

    expect(wrappers.find((wrapper) => wrapper.language === "python")?.code).toContain(
      'sum_two(*__case["arguments"])',
    );
    expect(wrappers.find((wrapper) => wrapper.language === "javascript")?.code).toContain(
      'eval("sumTwo")',
    );
    expect(wrappers.find((wrapper) => wrapper.language === "java")?.code).toContain("sumTwo(2, 3)");
    expect(wrappers.find((wrapper) => wrapper.language === "cpp")?.code).toContain("sum_two(2, 3)");
    expect(wrappers.find((wrapper) => wrapper.language === "go")?.code).toContain("SumTwo(2, 3)");
  });

  it("rejects stdin-only cases because function wrappers do not consume stdin", () => {
    expect(() =>
      buildPracticeTestWrapper({
        language: "python",
        functionName: "countPositive",
        userCode: "def countPositive():\n    return 0",
        testCases: [
          {
            id: "visible-1-stdin",
            name: "stdin",
            input: {
              arguments: [],
              stdin: "1 2 3",
            },
            expectedOutput: 3,
            comparator: "deepEqual",
            timeoutMs: 3_000,
            visibility: "visible",
          },
        ],
      }),
    ).toThrow("Practice test wrappers require function arguments.");
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
