import { describe, expect, it } from "vitest";
import {
  PRACTICE_PROBLEM_CONTRACT_VERSION,
  buildStructuredPracticeProblemContractInstructions,
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
          callableName: "count_positive",
          signature: "def count_positive(nums: list[int]) -> int:",
          starterCode: "def count_positive(nums: list[int]) -> int:\n    pass",
        },
        {
          language: "javascript",
          callableName: "countPositive",
          signature: "function countPositive(nums) { }",
          starterCode: "export function countPositive(nums) {\n  return 0;\n}",
        },
        {
          language: "java",
          callableName: "countPositive",
          signature: "public static int countPositive(int[] nums)",
          starterCode: "public static int countPositive(int[] nums) {\n  return 0;\n}",
        },
        {
          language: "cpp",
          callableName: "count_positive",
          signature: "int count_positive(vector<int> nums)",
          starterCode: "int count_positive(vector<int> nums) {\n  return 0;\n}",
        },
        {
          language: "go",
          callableName: "CountPositive",
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

  it("accepts missing non-selected language signatures", () => {
    const problem = validProblem();
    problem.functionSignature.languageSignatures =
      problem.functionSignature.languageSignatures.filter((item) => item.language !== "go");

    const parsed = parseStructuredPracticeProblem(problem);

    expect(parsed.functionSignature.languageSignatures.map((item) => item.language)).not.toContain(
      "go",
    );
  });

  it("rejects invalid callable names in language signatures", () => {
    const problem = validProblem();
    problem.functionSignature.languageSignatures[1]!.callableName = "count-positive";

    const result = validateStructuredPracticeProblem(problem);

    expect(result.ok).toBe(false);
    expect(result.issues).toContain(
      "functionSignature.languageSignatures.1.callableName: Callable name must be a valid identifier.",
    );
  });

  it("normalizes common AI aliases before validating the stored contract", () => {
    type AiAliasProblem = Omit<
      ReturnType<typeof validProblem>,
      "functionSignature" | "visibleTests" | "hiddenTests"
    > & {
      functionSignature: Omit<
        ReturnType<typeof validProblem>["functionSignature"],
        "languageSignatures"
      > & {
        languageSignatures: unknown;
      };
      visibleTests: unknown[];
      hiddenTests: unknown[];
    };

    const baseProblem = validProblem();
    const visibleTest = baseProblem.visibleTests[0]!;
    const hiddenTest = baseProblem.hiddenTests[0]!;
    const problem: AiAliasProblem = {
      ...baseProblem,
      functionSignature: {
        ...baseProblem.functionSignature,
        languageSignatures: {
          python: {
            callableName: "count_positive",
            signature: "def count_positive(nums: list[int]) -> int:",
            starterCode: "def count_positive(nums: list[int]) -> int:\n    pass",
          },
          javascript: {
            callableName: "countPositive",
            signature: "function countPositive(nums) { }",
            starterCode: "export function countPositive(nums) {\n  return 0;\n}",
          },
          java: {
            callableName: "countPositive",
            signature: "public static int countPositive(int[] nums)",
            starterCode: "public static int countPositive(int[] nums) {\n  return 0;\n}",
          },
          cpp: {
            callableName: "count_positive",
            signature: "int count_positive(vector<int> nums)",
            starterCode: "int count_positive(vector<int> nums) {\n  return 0;\n}",
          },
          go: {
            callableName: "CountPositive",
            signature: "func CountPositive(nums []int) int",
            starterCode: "func CountPositive(nums []int) int {\n\treturn 0\n}",
          },
        },
      },
      visibleTests: [
        {
          name: visibleTest.name,
          arguments: visibleTest.arguments,
          expectedOutput: visibleTest.expected,
          theme: visibleTest.theme,
          visibility: "visible",
        },
      ],
      hiddenTests: [
        {
          name: hiddenTest.name,
          args: hiddenTest.arguments,
          expectedOutput: hiddenTest.expected,
          theme: hiddenTest.theme,
          visibility: "hidden",
        },
      ],
    };

    const parsed = parseStructuredPracticeProblem(problem);

    expect(parsed.functionSignature.languageSignatures).toHaveLength(5);
    expect(parsed.functionSignature.languageSignatures[0]).toMatchObject({
      language: "python",
      callableName: "count_positive",
    });
    expect(parsed.visibleTests[0]?.expected).toBe(2);
    expect(parsed.hiddenTests[0]?.arguments).toEqual([[]]);
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

  it("strips vague extra fields from AI output", () => {
    const parsed = parseStructuredPracticeProblem({
      ...validProblem(),
      markdownPrompt: "Solve this however you want.",
    }) as Record<string, unknown>;

    expect(parsed.markdownPrompt).toBeUndefined();
  });

  it("rejects non-contiguous hint order values", () => {
    const problem = validProblem();
    problem.hintLadder = [
      {
        order: 2,
        title: "Second hint",
        body: "This skips the first hint.",
      },
    ];

    const result = validateStructuredPracticeProblem(problem);

    expect(result.ok).toBe(false);
    expect(result.issues).toContain(
      "hintLadder: Hint order values must start at 1 and have no gaps.",
    );
  });

  it("documents nested JSON fields for generated practice problems", () => {
    const instructions = buildStructuredPracticeProblemContractInstructions();

    expect(instructions).toContain("functionSignature.languageSignatures");
    expect(instructions).toContain("visibleTests and hiddenTests");
    expect(instructions).toContain("arguments");
    expect(instructions).toContain("expected");
    expect(instructions).toContain("hiddenTestThemes");
  });

  it("rejects nested or object test values that wrappers cannot execute", () => {
    const problem = validProblem();
    problem.visibleTests = [
      {
        name: "nested values",
        arguments: [[[1, 2]]],
        expected: { count: 2 },
        theme: "nested values",
        visibility: "visible",
      },
    ];

    const result = validateStructuredPracticeProblem(problem);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.includes("visibleTests.0.arguments"))).toBe(true);
    expect(result.issues.some((issue) => issue.includes("visibleTests.0.expected"))).toBe(true);
  });
});
