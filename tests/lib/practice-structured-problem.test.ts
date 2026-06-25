import { describe, expect, it } from "vitest";
import { buildPracticeGenerationPlan } from "@/lib/practice-generation-plan.server";
import {
  PRACTICE_PROBLEM_CONTRACT_VERSION,
  type StructuredPracticeProblem,
} from "@/lib/practice-problem-contract";
import {
  buildStructuredPracticeProblemInsert,
  buildStructuredPracticeProblemSchema,
  formatStructuredPracticePrompt,
  getStructuredCallableName,
  getStructuredStarterCode,
} from "@/lib/practice-structured-problem.server";
import { buildPracticeProblemView } from "@/lib/practice-problem-view";

function validProblem(): StructuredPracticeProblem {
  return {
    contractVersion: PRACTICE_PROBLEM_CONTRACT_VERSION,
    curriculumNodeId: "foundation-io",
    title: "Return the Sum",
    topicTags: [{ slug: "foundation", label: "Foundation" }],
    prerequisiteTags: [],
    masteryBand: "0-20",
    objective: "Read small values, store them in variables, and return or print a direct result.",
    statement: "Given two integers, return their sum.",
    examples: [
      {
        input: "a = 2, b = 3",
        output: "5",
        explanation: "2 plus 3 is 5.",
      },
    ],
    constraints: ["-100 <= a <= 100", "-100 <= b <= 100"],
    functionSignature: {
      functionName: "sum_two",
      parameters: [
        { name: "a", type: "int" },
        { name: "b", type: "int" },
      ],
      returnType: "int",
      languageSignatures: [
        {
          language: "python",
          callableName: "sum_two",
          signature: "def sum_two(a: int, b: int) -> int:",
          starterCode: "def sum_two(a: int, b: int) -> int:\n    # TODO: return the sum\n    pass",
        },
        {
          language: "javascript",
          callableName: "sumTwo",
          signature: "function sumTwo(a, b) { }",
          starterCode: "export function sumTwo(a, b) {\n  // TODO: return the sum\n  return 0;\n}",
        },
        {
          language: "java",
          callableName: "sumTwo",
          signature: "public static int sumTwo(int a, int b)",
          starterCode:
            "public static int sumTwo(int a, int b) {\n  // TODO: return the sum\n  return 0;\n}",
        },
        {
          language: "cpp",
          callableName: "sum_two",
          signature: "int sum_two(int a, int b)",
          starterCode: "int sum_two(int a, int b) {\n  // TODO: return the sum\n  return 0;\n}",
        },
        {
          language: "go",
          callableName: "SumTwo",
          signature: "func SumTwo(a int, b int) int",
          starterCode: "func SumTwo(a int, b int) int {\n\t// TODO: return the sum\n\treturn 0\n}",
        },
      ],
    },
    visibleTests: [
      {
        name: "positive values",
        arguments: [2, 3],
        expected: 5,
        theme: "positive values",
        visibility: "visible",
      },
    ],
    hiddenTests: [
      {
        name: "negative values",
        arguments: [-2, -3],
        expected: -5,
        theme: "negative values",
        visibility: "hidden",
      },
    ],
    hiddenTestThemes: ["negative values"],
    hintLadder: [
      {
        order: 1,
        title: "Use addition",
        body: "The result should combine both inputs with the addition operator.",
      },
    ],
    successCriteria: ["Returns a number", "Uses both inputs", "Handles negative values"],
  };
}

describe("structured practice problem generation helpers", () => {
  it("validates generated JSON against the selected curriculum plan", () => {
    const generationPlan = buildPracticeGenerationPlan({});
    const result = buildStructuredPracticeProblemSchema(generationPlan).safeParse(validProblem());

    expect(result.success).toBe(true);
  });

  it("canonicalizes server-owned metadata before validating AI content", () => {
    const generationPlan = buildPracticeGenerationPlan({});
    const aiProblem = {
      ...validProblem(),
      contractVersion: "wrong-contract",
      curriculumNodeId: "wrong-node",
      masteryBand: "81-100",
      objective: "Return the sum of two integers.",
      hiddenTestThemes: ["wrong theme"],
      hintLadder: [
        {
          order: 3,
          title: "Use addition",
          body: "Return the result of adding both inputs.",
        },
      ],
      solution: "return a + b",
    };

    const parsed = buildStructuredPracticeProblemSchema(generationPlan, {
      language: "python",
    }).parse(aiProblem) as StructuredPracticeProblem & { solution?: string };

    expect(parsed.contractVersion).toBe(PRACTICE_PROBLEM_CONTRACT_VERSION);
    expect(parsed.curriculumNodeId).toBe("foundation-io");
    expect(parsed.masteryBand).toBe("0-20");
    expect(parsed.objective).toBe(
      "Read small values, store them in variables, and return or print a direct result.",
    );
    expect(parsed.hiddenTestThemes).toEqual(["negative values"]);
    expect(parsed.hintLadder.map((hint) => hint.order)).toEqual([1]);
    expect(parsed.solution).toBeUndefined();
  });

  it("accepts missing non-selected language signatures during generation", () => {
    const generationPlan = buildPracticeGenerationPlan({});
    const aiProblem = {
      ...validProblem(),
      functionSignature: {
        ...validProblem().functionSignature,
        languageSignatures: [
          validProblem().functionSignature.languageSignatures.find(
            (signature) => signature.language === "python",
          )!,
        ],
      },
    };

    const parsed = buildStructuredPracticeProblemSchema(generationPlan, {
      language: "python",
    }).parse(aiProblem);

    expect(parsed.functionSignature.languageSignatures).toHaveLength(1);
    expect(parsed.functionSignature.languageSignatures[0]?.language).toBe("python");
  });

  it("normalizes common AI alias fields during generation", () => {
    const generationPlan = buildPracticeGenerationPlan({});
    const base = validProblem();
    const aiProblem = {
      contract_version: "ignored",
      curriculum_node_id: "ignored",
      name: base.title,
      tags: ["foundation"],
      prerequisites: [],
      mastery_band: "81-100",
      objective: "ignored",
      prompt: base.statement,
      examples: [{ input: { a: 2, b: 3 }, expectedOutput: 5 }],
      constraints: "a and b are integers",
      function_signature: {
        function_name: "sum_two",
        params: base.functionSignature.parameters,
        return_type: "int",
        starter_code: "def sum_two(a: int, b: int) -> int:\n    # TODO\n    pass",
      },
      visible_tests: [{ title: "positive values", args: [2, 3], expectedOutput: 5 }],
      hidden_tests: [{ title: "negative values", inputs: [-2, -3], output: -5 }],
      hints: ["Add the two input values."],
      success_criteria: ["Returns the expected sum."],
    };

    const parsed = buildStructuredPracticeProblemSchema(generationPlan, {
      language: "python",
    }).parse(aiProblem);

    expect(parsed.title).toBe(base.title);
    expect(parsed.topicTags).toEqual([{ slug: "foundation", label: "foundation" }]);
    expect(parsed.constraints).toEqual(["a and b are integers"]);
    expect(parsed.functionSignature.languageSignatures).toEqual([
      {
        language: "python",
        callableName: "sum_two",
        signature: "def sum_two(a: int, b: int) -> int:",
        starterCode: "def sum_two(a: int, b: int) -> int:\n    # TODO\n    pass",
      },
    ]);
    expect(parsed.visibleTests[0]).toMatchObject({
      name: "positive values",
      arguments: [2, 3],
      expected: 5,
      theme: "positive values",
      visibility: "visible",
    });
    expect(parsed.hiddenTestThemes).toEqual(["negative values"]);
    expect(parsed.hintLadder).toEqual([
      { order: 1, title: "Hint 1", body: "Add the two input values." },
    ]);
  });

  it("rejects generated content that is missing the selected language signature", () => {
    const generationPlan = buildPracticeGenerationPlan({});
    const aiProblem = {
      ...validProblem(),
      functionSignature: {
        ...validProblem().functionSignature,
        languageSignatures: [
          validProblem().functionSignature.languageSignatures.find(
            (signature) => signature.language === "javascript",
          )!,
        ],
      },
    };

    const result = buildStructuredPracticeProblemSchema(generationPlan, {
      language: "python",
    }).safeParse(aiProblem);

    expect(result.success).toBe(false);
    expect(
      result.error?.issues.some(
        (issue) =>
          issue.path.join(".") === "functionSignature.languageSignatures" &&
          issue.message === "Missing python function signature.",
      ),
    ).toBe(true);
  });

  it("stores a true-beginner first generated problem for an empty-mastery learner", () => {
    const generationPlan = buildPracticeGenerationPlan({ progressRows: [] });
    const parsedProblem =
      buildStructuredPracticeProblemSchema(generationPlan).parse(validProblem());
    const insert = buildStructuredPracticeProblemInsert({
      userId: "beginner-user-1",
      language: "python",
      generationPlan,
      problem: parsedProblem,
    });

    expect(insert).toMatchObject({
      user_id: "beginner-user-1",
      curriculum_node_id: "foundation-io",
      mastery_band: "0-20",
      objective: "Read small values, store them in variables, and return or print a direct result.",
      generation_status: "structured",
      planning_context: {
        source: "beginner-start",
        selectedCurriculumNodeId: "foundation-io",
        selectedMasteryBand: "0-20",
        bridgePreview: null,
      },
    });
    expect(insert.prompt).toContain("Objective: Read small values");
    expect(insert.starter_code).toContain("def sum_two");
  });

  it("stores a manual advanced-topic request as a beginner bridge problem with preview", () => {
    const generationPlan = buildPracticeGenerationPlan({
      topicSlug: "two-pointers",
      progressRows: [{ topic_slug: "two-pointers", mastery: 0.1 }],
    });
    const parsedProblem =
      buildStructuredPracticeProblemSchema(generationPlan).parse(validProblem());
    const insert = buildStructuredPracticeProblemInsert({
      userId: "bridge-user-1",
      language: "python",
      generationPlan,
      problem: parsedProblem,
    });
    const view = buildPracticeProblemView(insert);

    expect(generationPlan.aiPromptTopicSlug).toBeNull();
    expect(insert).toMatchObject({
      user_id: "bridge-user-1",
      topic_slug: null,
      curriculum_node_id: "foundation-io",
      mastery_band: "0-20",
      objective: "Read small values, store them in variables, and return or print a direct result.",
      generation_status: "structured",
      planning_context: {
        source: "manual-topic",
        requestedTopicSlug: "two-pointers",
        selectedCurriculumNodeId: "foundation-io",
        selectedMasteryBand: "0-20",
        bridgePreview: {
          targetTopicSlug: "two-pointers",
          targetCurriculumNodeId: "two-pointers-basics",
          targetMasteryBand: "21-40",
        },
      },
    });
    expect(insert.prompt).toContain("Objective: Read small values");
    expect(insert.prompt).not.toContain("Two Pointers");
    expect(view.bridgePreview).toMatchObject({
      currentNodeId: "foundation-io",
      targetTopicSlug: "two-pointers",
      targetNodeId: "two-pointers-basics",
    });
  });

  it("overrides structured JSON for the wrong mastery band", () => {
    const generationPlan = buildPracticeGenerationPlan({});
    const parsed = buildStructuredPracticeProblemSchema(generationPlan).parse({
      ...validProblem(),
      masteryBand: "21-40",
    });

    expect(parsed.masteryBand).toBe("0-20");
  });

  it("formats the stored prompt from structured JSON instead of AI markdown", () => {
    const prompt = formatStructuredPracticePrompt(validProblem());

    expect(prompt).toContain("Objective: Read small values");
    expect(prompt).toContain("Language callable names");
    expect(prompt).toContain("Visible tests");
    expect(prompt).toContain("Hidden-test themes");
  });

  it("builds the structured practice insert payload", () => {
    const generationPlan = buildPracticeGenerationPlan({});
    const insert = buildStructuredPracticeProblemInsert({
      userId: "user-1",
      language: "javascript",
      generationPlan,
      problem: validProblem(),
    });

    expect(insert.generation_status).toBe("structured");
    expect(insert.contract_version).toBe(PRACTICE_PROBLEM_CONTRACT_VERSION);
    expect(insert.starter_code).toContain("export function sumTwo");
    expect(insert.visible_tests).toEqual(validProblem().visibleTests);
    expect(insert.planning_context).toMatchObject({
      source: "beginner-start",
      selectedCurriculumNodeId: "foundation-io",
      bridgePreview: null,
    });
  });

  it("selects starter code for the requested language", () => {
    expect(getStructuredStarterCode(validProblem(), "go")).toContain("func SumTwo");
  });

  it("selects the callable name for the requested language", () => {
    expect(getStructuredCallableName(validProblem(), "javascript")).toBe("sumTwo");
    expect(getStructuredCallableName(validProblem(), "go")).toBe("SumTwo");
  });
});
