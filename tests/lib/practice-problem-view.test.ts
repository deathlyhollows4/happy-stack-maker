import { describe, expect, it } from "vitest";
import {
  buildPracticeAttemptSummary,
  buildPracticeHistoryView,
  buildPracticeProblemListItem,
  buildPracticeVisibleTestRunInput,
  buildPracticeProblemView,
  getPracticeProblemBody,
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

  it("derives bridge preview data when a saved target topic is ahead of the current node", () => {
    const view = buildPracticeProblemView({
      ...structuredProblemRow(),
      topic_slug: "two-pointers",
      curriculum_node_id: "foundation-io",
      planning_context: {
        source: "manual-topic",
        requestedTopicSlug: "two-pointers",
        selectedTopicSlug: null,
        selectedCurriculumNodeId: "foundation-io",
        selectedCurriculumNodeTitle: "Input, Output, And Values",
        selectedMasteryBand: "0-20",
        bridgePreview: {
          targetTopicSlug: "two-pointers",
          targetCurriculumNodeId: "two-pointers-basics",
          targetCurriculumNodeTitle: "Two Pointers",
          targetMasteryBand: "21-40",
        },
      },
    });

    expect(view.bridgePreview).toEqual({
      currentNodeId: "foundation-io",
      currentNodeTitle: "Input, Output, And Values",
      targetTopicSlug: "two-pointers",
      targetTopicLabel: "Two Pointers",
      targetNodeId: "two-pointers-basics",
      targetNodeTitle: "Two Pointers",
    });
  });

  it("does not show bridge preview data without manual planner context", () => {
    const view = buildPracticeProblemView({
      ...structuredProblemRow(),
      topic_slug: "two-pointers",
      curriculum_node_id: "foundation-io",
    });

    expect(view.bridgePreview).toBeNull();
  });

  it("does not show bridge preview data for non-manual planner sources", () => {
    const view = buildPracticeProblemView({
      ...structuredProblemRow(),
      topic_slug: "two-pointers",
      curriculum_node_id: "foundation-io",
      planning_context: {
        source: "weakest-topic",
        requestedTopicSlug: "two-pointers",
        selectedTopicSlug: null,
        selectedCurriculumNodeId: "foundation-io",
        selectedCurriculumNodeTitle: "Input, Output, And Values",
        selectedMasteryBand: "0-20",
        bridgePreview: {
          targetTopicSlug: "two-pointers",
          targetCurriculumNodeId: "two-pointers-basics",
          targetCurriculumNodeTitle: "Two Pointers",
          targetMasteryBand: "21-40",
        },
      },
    });

    expect(view.bridgePreview).toBeNull();
  });

  it("returns the active language signature when available", () => {
    const view = buildPracticeProblemView(structuredProblemRow());

    expect(getPracticeLanguageSignature(view, "javascript")?.callableName).toBe("countPositive");
    expect(getPracticeLanguageSignature(view, "ruby")).toBeNull();
  });

  it("builds visible test run input from normalized structured fields", () => {
    const view = buildPracticeProblemView(structuredProblemRow());
    const testRun = buildPracticeVisibleTestRunInput(view, "javascript");

    expect(testRun?.functionName).toBe("countPositive");
    expect(testRun?.visibleTests).toEqual(view.visibleTests);
  });

  it("uses the structured statement as the problem body", () => {
    const view = buildPracticeProblemView(structuredProblemRow());

    expect(getPracticeProblemBody(view)).toEqual({
      kind: "structured",
      text: "Given a list of integers, return how many values are greater than zero.",
    });
  });

  it("does not render stored markdown as the body for incomplete structured rows", () => {
    const view = buildPracticeProblemView({
      ...structuredProblemRow(),
      prompt: "Fallback markdown should stay hidden for structured rows.",
      statement: null,
    });

    expect(getPracticeProblemBody(view)).toEqual({
      kind: "missing",
      text: "Problem statement is unavailable. Generate a new problem or try again.",
    });
  });

  it("keeps legacy markdown rows renderable", () => {
    const view = buildPracticeProblemView({
      prompt: "Solve this practice problem.",
      generation_status: "legacy",
    });

    expect(view.isStructured).toBe(false);
    expect(view.promptFallback).toBe("Solve this practice problem.");
    expect(view.visibleTests).toEqual([]);
    expect(getPracticeProblemBody(view)).toEqual({
      kind: "legacy",
      text: "Solve this practice problem.",
    });
  });

  it("keeps partially structured legacy rows renderable without enabling structured execution", () => {
    const view = buildPracticeProblemView({
      prompt: "### Problem\nReturn the larger number.",
      generation_status: "legacy",
      curriculum_node_id: "foundation-conditionals",
      mastery_band: "0-20",
      objective: "Choose a branch with an if statement.",
      statement: "Given two integers, return the larger value.",
      visible_tests: [
        {
          name: "first larger",
          arguments: [4, 2],
          expected: 4,
          theme: "branching",
          visibility: "visible",
        },
      ],
    });

    expect(view.isStructured).toBe(false);
    expect(view.curriculumNodeId).toBe("foundation-conditionals");
    expect(view.masteryBandLabel).toBe("Concept drill");
    expect(view.visibleTests).toEqual([]);
    expect(buildPracticeVisibleTestRunInput(view, "python")).toBeUndefined();
    expect(getPracticeProblemBody(view)).toEqual({
      kind: "legacy",
      text: "### Problem\nReturn the larger number.",
    });
  });

  it("renders backfilled legacy rows from prompt or statement without treating them as structured", () => {
    const promptBackfilledView = buildPracticeProblemView({
      prompt: "Legacy markdown body",
      generation_status: "legacy",
      planning_context: {
        legacyBackfill: {
          version: "legacy-practice-problem.v1",
          renderMode: "markdown",
        },
      },
    });
    const statementBackfilledView = buildPracticeProblemView({
      prompt: "",
      statement: "Backfilled legacy body",
      generation_status: "legacy",
      planning_context: {
        legacyBackfill: {
          version: "legacy-practice-problem.v1",
          renderMode: "markdown",
        },
      },
    });

    expect(promptBackfilledView.isStructured).toBe(false);
    expect(getPracticeProblemBody(promptBackfilledView)).toEqual({
      kind: "legacy",
      text: "Legacy markdown body",
    });
    expect(statementBackfilledView.isStructured).toBe(false);
    expect(getPracticeProblemBody(statementBackfilledView)).toEqual({
      kind: "legacy",
      text: "Backfilled legacy body",
    });
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

  it("maps structured problem fields into a practice history list item", () => {
    const item = buildPracticeProblemListItem({
      ...structuredProblemRow(),
      id: "11111111-1111-4111-8111-111111111111",
      title: "Count Positive Numbers",
      language: "python",
      topic_slug: "arrays",
      created_at: "2026-06-23T09:00:00.000Z",
    });

    expect(item).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Count Positive Numbers",
      topicSlug: "arrays",
      topicLabel: "Arrays",
      language: "python",
      createdAt: "2026-06-23T09:00:00.000Z",
      isStructured: true,
      curriculumNodeId: "foundation-loops",
      masteryBand: "0-20",
      masteryBandLabel: "Concept drill",
      objective: "Count values greater than zero using one loop.",
      visibleTestCount: 1,
      hiddenThemeCount: 1,
      hintCount: 2,
      attemptCount: 0,
      completedAttemptCount: 0,
      attempts: [],
      latestAttempt: null,
    });
    expect(item?.topicTags).toEqual([{ slug: "loops", label: "Loops" }]);
    expect(item?.prerequisiteTags).toEqual([{ slug: "conditions", label: "Conditionals" }]);
  });

  it("normalizes attempt summaries without exposing hidden test pass details", () => {
    const summary = buildPracticeAttemptSummary({
      id: "22222222-2222-4222-8222-222222222222",
      practice_problem_id: "11111111-1111-4111-8111-111111111111",
      language: "python",
      status: "completed",
      visible_tests_passed: 2,
      visible_tests_total: 3,
      hidden_tests_passed: 4,
      hidden_tests_total: 5,
      correctness_score: 0.82,
      hint_count: 1,
      review_quality_score: 0.75,
      speed_seconds: 370,
      completed_at: "2026-06-23T09:12:00.000Z",
      created_at: "2026-06-23T09:11:00.000Z",
    });

    expect(summary).toEqual({
      id: "22222222-2222-4222-8222-222222222222",
      practiceProblemId: "11111111-1111-4111-8111-111111111111",
      language: "python",
      status: "completed",
      visible: {
        passed: 2,
        total: 3,
        failed: 1,
      },
      hiddenChecksRun: true,
      correctnessPercent: 82,
      hintCount: 1,
      reviewQualityScore: 0.75,
      speedSeconds: 370,
      completedAt: "2026-06-23T09:12:00.000Z",
    });
    expect(summary).not.toHaveProperty("hiddenTestsPassed");
    expect(summary).not.toHaveProperty("hiddenTestsTotal");
    expect(summary).not.toHaveProperty("hidden");
  });

  it("maps practice history with latest attempt and completed attempt count", () => {
    const history = buildPracticeHistoryView({
      problems: [
        {
          ...structuredProblemRow(),
          id: "11111111-1111-4111-8111-111111111111",
          title: "Count Positive Numbers",
          language: "python",
          topic_slug: "arrays",
          created_at: "2026-06-23T09:00:00.000Z",
        },
      ],
      attempts: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          practice_problem_id: "11111111-1111-4111-8111-111111111111",
          status: "failed",
          visible_tests_passed: 1,
          visible_tests_total: 2,
          correctness_score: 0.4,
          hint_count: 2,
          created_at: "2026-06-23T09:05:00.000Z",
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          practice_problem_id: "11111111-1111-4111-8111-111111111111",
          status: "completed",
          visible_tests_passed: 2,
          visible_tests_total: 2,
          correctness_score: 1,
          hint_count: 0,
          completed_at: "2026-06-23T09:15:00.000Z",
        },
      ],
    });

    expect(history).toHaveLength(1);
    expect(history[0]?.attemptCount).toBe(2);
    expect(history[0]?.completedAttemptCount).toBe(1);
    expect(history[0]?.attempts.map((attempt) => attempt.id)).toEqual([
      "33333333-3333-4333-8333-333333333333",
      "22222222-2222-4222-8222-222222222222",
    ]);
    expect(history[0]?.latestAttempt).toMatchObject({
      id: "33333333-3333-4333-8333-333333333333",
      status: "completed",
      visible: {
        passed: 2,
        total: 2,
        failed: 0,
      },
      correctnessPercent: 100,
    });
  });
});
