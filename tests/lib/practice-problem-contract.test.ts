import { describe, expect, it } from "vitest";
import {
  PRACTICE_PROBLEM_CONTRACT_VERSION,
  parseStructuredPracticeProblem,
  validateStructuredPracticeProblem,
} from "@/lib/practice-problem-contract";

function validProblem() {
  return {
    contractVersion: PRACTICE_PROBLEM_CONTRACT_VERSION,
    curriculumNodeId: "foundation-loops",
    title: "Count Positive Numbers",
    topicTags: [{ slug: "loops", label: "Loops" }],
    prerequisiteTags: [{ slug: "conditions", label: "Conditionals" }],
    masteryBand: "0-20",
    objective: "Count values greater than zero using one loop.",
    statement: "Given a list of integers, return how many values are greater than zero.",
    examples: [
      {
        input: "nums = [-1, 2, 0, 4]",
        output: "2",
        explanation: "The positive values are 2 and 4.",
      },
    ],
    constraints: ["0 <= nums.length <= 100", "-1000 <= nums[i] <= 1000"],
    functionSignature: {
      functionName: "count_positive",
      parameters: [{ name: "nums", type: "array<int>" }],
      returnType: "int",
      languageSignatures: [
        {
          language: "python",
          signature: "def count_positive(nums: list[int]) -> int:",
          starterCode: "def count_positive(nums: list[int]) -> int:\n    pass",
        },
        {
          language: "javascript",
          signature: "function countPositive(nums) { }",
          starterCode: "export function countPositive(nums) {\n  return 0;\n}",
        },
        {
          language: "java",
          signature: "public static int countPositive(int[] nums)",
          starterCode: "public static int countPositive(int[] nums) {\n  return 0;\n}",
        },
        {
          language: "cpp",
          signature: "int count_positive(vector<int> nums)",
          starterCode: "int count_positive(vector<int> nums) {\n  return 0;\n}",
        },
        {
          language: "go",
          signature: "func CountPositive(nums []int) int",
          starterCode: "func CountPositive(nums []int) int {\n\treturn 0\n}",
        },
      ],
    },
    visibleTests: [
      {
        name: "mixed values",
        arguments: [[-1, 2, 0, 4]],
        expected: 2,
        theme: "mixed values",
        visibility: "visible",
      },
    ],
    hiddenTests: [
      {
        name: "empty list",
        arguments: [[]],
        expected: 0,
        theme: "empty list",
        visibility: "hidden",
      },
    ],
    hiddenTestThemes: ["empty list"],
    hintLadder: [
      {
        order: 1,
        title: "Track a count",
        body: "Start a counter at zero before the loop.",
      },
    ],
    successCriteria: ["Uses one loop", "Returns the counter", "Handles an empty list"],
  };
}

describe("StructuredPracticeProblemSchema", () => {
  it("accepts the full structured generated problem contract", () => {
    expect(parseStructuredPracticeProblem(validProblem()).title).toBe("Count Positive Numbers");
  });

  it("rejects missing language signatures", () => {
    const problem = validProblem();
    problem.functionSignature.languageSignatures =
      problem.functionSignature.languageSignatures.filter((item) => item.language !== "go");

    const result = validateStructuredPracticeProblem(problem);

    expect(result.ok).toBe(false);
    expect(result.issues).toContain(
      "functionSignature.languageSignatures: Missing go function signature.",
    );
  });

  it("rejects hidden-test themes without generated hidden tests", () => {
    const problem = validProblem();
    problem.hiddenTestThemes = ["empty list", "negative values"];

    const result = validateStructuredPracticeProblem(problem);

    expect(result.ok).toBe(false);
    expect(result.issues).toContain(
      "hiddenTestThemes: Hidden-test theme has no matching hidden test: negative values.",
    );
  });

  it("rejects vague extra fields from AI output", () => {
    const result = validateStructuredPracticeProblem({
      ...validProblem(),
      markdownPrompt: "Solve this however you want.",
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.includes("Unrecognized key"))).toBe(true);
  });
});
