import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import type { PracticeGenerationPlan } from "@/lib/practice-generation-plan.server";
import {
  StructuredPracticeProblemSchema,
  type PracticeProblemLanguage,
  type StructuredPracticeProblem,
} from "@/lib/practice-problem-contract";

export function buildStructuredPracticeProblemSchema(generationPlan: PracticeGenerationPlan) {
  return StructuredPracticeProblemSchema.superRefine((problem, ctx) => {
    if (problem.curriculumNodeId !== generationPlan.practicePlan.node.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["curriculumNodeId"],
        message: `Expected curriculum node ${generationPlan.practicePlan.node.id}.`,
      });
    }

    if (problem.masteryBand !== generationPlan.practicePlan.masteryBand.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["masteryBand"],
        message: `Expected mastery band ${generationPlan.practicePlan.masteryBand.id}.`,
      });
    }

    if (problem.objective !== generationPlan.practicePlan.node.objective) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["objective"],
        message: "Objective must match the selected curriculum node.",
      });
    }
  });
}

export function getStructuredStarterCode(
  problem: StructuredPracticeProblem,
  language: PracticeProblemLanguage,
) {
  return (
    problem.functionSignature.languageSignatures.find((item) => item.language === language)
      ?.starterCode ?? ""
  );
}

export function getStructuredCallableName(
  problem: StructuredPracticeProblem,
  language: PracticeProblemLanguage,
) {
  return (
    problem.functionSignature.languageSignatures.find((item) => item.language === language)
      ?.callableName ?? problem.functionSignature.functionName
  );
}

export function formatStructuredPracticePrompt(problem: StructuredPracticeProblem) {
  const examples = problem.examples
    .map((example, index) =>
      [
        `Example ${index + 1}`,
        `Input: ${example.input}`,
        `Output: ${example.output}`,
        example.explanation ? `Explanation: ${example.explanation}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");

  return [
    `Objective: ${problem.objective}`,
    "",
    problem.statement,
    "",
    "Examples",
    examples,
    "",
    "Constraints",
    ...problem.constraints.map((constraint) => `- ${constraint}`),
    "",
    "Expected function signature",
    `${problem.functionSignature.functionName}(${problem.functionSignature.parameters
      .map((parameter) => `${parameter.name}: ${parameter.type}`)
      .join(", ")}) -> ${problem.functionSignature.returnType}`,
    "",
    "Language callable names",
    ...problem.functionSignature.languageSignatures.map(
      (item) => `- ${item.language}: ${item.callableName}`,
    ),
    "",
    "Visible tests",
    ...problem.visibleTests.map(
      (test) =>
        `- ${test.name}: arguments ${JSON.stringify(test.arguments)}, expected ${JSON.stringify(test.expected)}`,
    ),
    "",
    "Hidden-test themes",
    ...problem.hiddenTestThemes.map((theme) => `- ${theme}`),
    "",
    "Hints",
    ...problem.hintLadder
      .sort((a, b) => a.order - b.order)
      .map((hint) => `${hint.order}. ${hint.title}: ${hint.body}`),
    "",
    "Success criteria",
    ...problem.successCriteria.map((criterion) => `- ${criterion}`),
  ].join("\n");
}

export function buildStructuredPracticeProblemInsert(input: {
  userId: string;
  language: PracticeProblemLanguage;
  generationPlan: PracticeGenerationPlan;
  problem: StructuredPracticeProblem;
}) {
  const { generationPlan, problem } = input;

  return {
    user_id: input.userId,
    topic_slug: generationPlan.problemInsertPlan.topic_slug,
    contract_version: problem.contractVersion,
    curriculum_node_id: problem.curriculumNodeId,
    mastery_band: problem.masteryBand,
    objective: problem.objective,
    title: problem.title,
    prompt: formatStructuredPracticePrompt(problem),
    starter_code: getStructuredStarterCode(problem, input.language),
    language: input.language,
    statement: problem.statement,
    topic_tags: problem.topicTags as Json,
    prerequisite_tags: problem.prerequisiteTags as Json,
    examples: problem.examples as Json,
    constraints: problem.constraints as Json,
    function_signature: problem.functionSignature as Json,
    visible_tests: problem.visibleTests as Json,
    hidden_test_themes: problem.hiddenTestThemes as Json,
    hint_ladder: problem.hintLadder as Json,
    success_criteria: problem.successCriteria as Json,
    generation_status: "structured",
  };
}

export function buildStructuredPracticeHiddenTestsInsert(input: {
  userId: string;
  practiceProblemId: string;
  problem: StructuredPracticeProblem;
}) {
  return {
    user_id: input.userId,
    practice_problem_id: input.practiceProblemId,
    hidden_tests: input.problem.hiddenTests as Json,
  };
}
