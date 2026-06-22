import { describe, expect, it } from "vitest";
import {
  buildPracticeProblemView,
  getPracticeLanguageSignature,
} from "@/lib/practice-problem-view";
import { PRACTICE_PROBLEM_CONTRACT_VERSION } from "@/lib/practice-problem-contract";

function structuredProblemRow() {
  return {
    prompt: "Legacy prompt should not be the primary view.",
    contract_version: PRACTICE_PROBLEM_CONTRACT_VERSION,
    curriculum_node_id: "foundation-loops",
    mastery_band: "0-20",
    objective: "Count values greater than zero using one loop.",
    statement: "Given a list of integers, return how many values are greater than zero.",
    topic_tags: [{ slug: "loops", label: "Loops" }],
    prerequisite_tags: [{ slug: "conditions", label: "Conditionals" }],
    examples: [
      {
        input: "nums = [-1, 2, 0, 4]",
        output: "2",
        explanation: "The positive values are 2 and 4.",
      },
    ],
    constraints: ["0 <= nums.length <= 100"],
    function_signature: {
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
    visible_tests: [
      {
        name: "mixed values",
        arguments: [[-1, 2, 0, 4]],
        expected: 2,
        theme: "mixed values",
        visibility: "visible",
      },
    ],
    hidden_test_themes: ["empty list"],
    hint_ladder: [
      {
        order: 2,
        title: "Inspect each number",
        body: "Compare the current number with zero.",
      },
      {
        order: 1,
        title: "Track a count",
        body: "Start a counter before the loop.",
      },
    ],
    success_criteria: ["Uses one loop", "Returns the counter"],
    generation_status: "structured",
  };
}

describe("practice problem view", () => {
  it("normalizes structured practice problem fields for the UI", () => {
    const view = buildPracticeProblemView(structuredProblemRow());

    expect(view.isStructured).toBe(true);
    expect(view.curriculumNodeId).toBe("foundation-loops");
    expect(view.masteryBand).toBe("0-20");
    expect(view.masteryBandLabel).toBe("Concept drill");
    expect(view.topicTags).toEqual([{ slug: "loops", label: "Loops" }]);
    expect(view.examples).toHaveLength(1);
    expect(view.visibleTests[0]?.name).toBe("mixed values");
    expect(view.hintLadder.map((hint) => hint.order)).toEqual([1, 2]);
  });

  it("returns the active language signature when available", () => {
    const view = buildPracticeProblemView(structuredProblemRow());

    expect(getPracticeLanguageSignature(view, "javascript")?.callableName).toBe("countPositive");
    expect(getPracticeLanguageSignature(view, "ruby")).toBeNull();
  });

  it("keeps legacy markdown rows renderable", () => {
    const view = buildPracticeProblemView({
      prompt: "Solve this practice problem.",
      generation_status: "legacy",
    });

    expect(view.isStructured).toBe(false);
    expect(view.promptFallback).toBe("Solve this practice problem.");
    expect(view.visibleTests).toEqual([]);
  });

  it("ignores malformed JSONB fields instead of leaking invalid UI state", () => {
    const view = buildPracticeProblemView({
      ...structuredProblemRow(),
      examples: [{ input: "", output: "" }],
      visible_tests: [{ name: "bad", visibility: "visible" }],
      mastery_band: "101-120",
    });

    expect(view.masteryBand).toBeNull();
    expect(view.examples).toEqual([]);
    expect(view.visibleTests).toEqual([]);
    expect(view.isStructured).toBe(true);
  });
});
