import { z } from "zod";
import {
  PRACTICE_PROBLEM_CONTRACT_VERSION,
  PracticeProblemExampleSchema,
  PracticeProblemFunctionSignatureSchema,
  PracticeProblemHintSchema,
  PracticeProblemMasteryBandSchema,
  PracticeProblemTagSchema,
  PracticeProblemTestCaseSchema,
  type PracticeProblemExample,
  type PracticeProblemFunctionSignature,
  type PracticeProblemHint,
  type PracticeProblemMasteryBand,
  type PracticeProblemTag,
  type PracticeProblemTestCase,
} from "@/lib/practice-problem-contract";
import { getMasteryBandById } from "@/lib/dsa-curriculum";
import { normalizeTopicSlug, topicDisplayName, type TopicSlug } from "@/lib/topics";

const textArraySchema = z.array(z.string().trim().min(1).max(300));
const visibleTestArraySchema = z.array(
  PracticeProblemTestCaseSchema.extend({ visibility: z.literal("visible") }),
);
const planningContextSchema = z.object({
  source: z.enum(["manual-topic", "due-review", "weakest-topic", "beginner-start"]),
  requestedTopicSlug: z.string().nullable(),
  selectedTopicSlug: z.string().nullable(),
  selectedCurriculumNodeId: z.string().trim().min(1),
  selectedCurriculumNodeTitle: z.string().trim().min(1),
  selectedMasteryBand: PracticeProblemMasteryBandSchema,
  bridgePreview: z
    .object({
      targetTopicSlug: z.string().nullable(),
      targetCurriculumNodeId: z.string().trim().min(1),
      targetCurriculumNodeTitle: z.string().trim().min(1),
      targetMasteryBand: PracticeProblemMasteryBandSchema,
    })
    .nullable(),
});

export interface PracticeProblemViewInput {
  prompt?: string | null;
  topic_slug?: string | null;
  planning_context?: unknown;
  contract_version?: string | null;
  curriculum_node_id?: string | null;
  mastery_band?: string | null;
  objective?: string | null;
  statement?: string | null;
  topic_tags?: unknown;
  prerequisite_tags?: unknown;
  examples?: unknown;
  constraints?: unknown;
  function_signature?: unknown;
  visible_tests?: unknown;
  hidden_test_themes?: unknown;
  hint_ladder?: unknown;
  success_criteria?: unknown;
  generation_status?: string | null;
}

export interface PracticeBridgePreview {
  currentNodeId: string;
  currentNodeTitle: string;
  targetTopicSlug: TopicSlug;
  targetTopicLabel: string;
  targetNodeId: string;
  targetNodeTitle: string;
}

export interface PracticeProblemView {
  isStructured: boolean;
  promptFallback: string;
  contractVersion: string | null;
  curriculumNodeId: string | null;
  masteryBand: PracticeProblemMasteryBand | null;
  masteryBandLabel: string | null;
  objective: string | null;
  statement: string | null;
  topicTags: PracticeProblemTag[];
  prerequisiteTags: PracticeProblemTag[];
  bridgePreview: PracticeBridgePreview | null;
  examples: PracticeProblemExample[];
  constraints: string[];
  functionSignature: PracticeProblemFunctionSignature | null;
  visibleTests: Array<PracticeProblemTestCase & { visibility: "visible" }>;
  hiddenTestThemes: string[];
  hintLadder: PracticeProblemHint[];
  successCriteria: string[];
  generationStatus: string | null;
}

export interface PracticeProblemBody {
  kind: "structured" | "legacy" | "missing";
  text: string;
}

export interface PracticeVisibleTestRunInput {
  functionName: string;
  visibleTests: PracticeProblemView["visibleTests"];
}

function parseArray<T>(schema: z.ZodType<T[]>, input: unknown): T[] {
  const result = schema.safeParse(input);
  return result.success ? result.data : [];
}

function parseText(input: string | null | undefined): string | null {
  const trimmed = input?.trim();
  return trimmed ? trimmed : null;
}

function parseMasteryBand(input: string | null | undefined): PracticeProblemMasteryBand | null {
  const result = PracticeProblemMasteryBandSchema.safeParse(input);
  return result.success ? result.data : null;
}

function buildBridgePreview(input: PracticeProblemViewInput, currentNodeId: string | null) {
  const planningContext = planningContextSchema.safeParse(input.planning_context);
  if (!planningContext.success) return null;
  if (planningContext.data.source !== "manual-topic") return null;
  if (!planningContext.data.bridgePreview || !currentNodeId) return null;
  if (planningContext.data.selectedCurriculumNodeId !== currentNodeId) return null;

  const targetTopicSlug = normalizeTopicSlug(
    planningContext.data.bridgePreview.targetTopicSlug ?? planningContext.data.requestedTopicSlug,
  );
  if (!targetTopicSlug) return null;

  const bridgePreview = planningContext.data.bridgePreview;
  if (bridgePreview.targetCurriculumNodeId === currentNodeId) return null;

  return {
    currentNodeId,
    currentNodeTitle: planningContext.data.selectedCurriculumNodeTitle,
    targetTopicSlug,
    targetTopicLabel: topicDisplayName(targetTopicSlug),
    targetNodeId: bridgePreview.targetCurriculumNodeId,
    targetNodeTitle: bridgePreview.targetCurriculumNodeTitle,
  };
}

export function buildPracticeProblemView(input: PracticeProblemViewInput): PracticeProblemView {
  const masteryBand = parseMasteryBand(input.mastery_band);
  const functionSignature = PracticeProblemFunctionSignatureSchema.safeParse(
    input.function_signature,
  );
  const statement = parseText(input.statement);
  const objective = parseText(input.objective);
  const contractVersion = parseText(input.contract_version);
  const curriculumNodeId = parseText(input.curriculum_node_id);
  const generationStatus = parseText(input.generation_status);
  const topicTags = parseArray(z.array(PracticeProblemTagSchema), input.topic_tags);
  const prerequisiteTags = parseArray(z.array(PracticeProblemTagSchema), input.prerequisite_tags);
  const examples = parseArray(z.array(PracticeProblemExampleSchema), input.examples);
  const constraints = parseArray(textArraySchema, input.constraints);
  const visibleTests = parseArray(visibleTestArraySchema, input.visible_tests);
  const hiddenTestThemes = parseArray(textArraySchema, input.hidden_test_themes);
  const hintLadder = parseArray(z.array(PracticeProblemHintSchema), input.hint_ladder).sort(
    (a, b) => a.order - b.order,
  );
  const successCriteria = parseArray(textArraySchema, input.success_criteria);

  return {
    isStructured:
      generationStatus === "structured" ||
      contractVersion === PRACTICE_PROBLEM_CONTRACT_VERSION ||
      Boolean(statement || objective || examples.length || visibleTests.length),
    promptFallback: input.prompt ?? "",
    contractVersion,
    curriculumNodeId,
    masteryBand,
    masteryBandLabel: masteryBand ? getMasteryBandById(masteryBand).label : null,
    objective,
    statement,
    topicTags,
    prerequisiteTags,
    bridgePreview: buildBridgePreview(input, curriculumNodeId),
    examples,
    constraints,
    functionSignature: functionSignature.success ? functionSignature.data : null,
    visibleTests,
    hiddenTestThemes,
    hintLadder,
    successCriteria,
    generationStatus,
  };
}

export function getPracticeLanguageSignature(view: PracticeProblemView, language: string) {
  return (
    view.functionSignature?.languageSignatures.find(
      (signature) => signature.language === language,
    ) ?? null
  );
}

export function getPracticeProblemBody(view: PracticeProblemView): PracticeProblemBody {
  if (view.statement) {
    return { kind: "structured", text: view.statement };
  }

  if (!view.isStructured && view.promptFallback.trim()) {
    return { kind: "legacy", text: view.promptFallback };
  }

  return {
    kind: "missing",
    text: "Problem statement is unavailable. Generate a new problem or try again.",
  };
}

export function getPracticeCallableName(view: PracticeProblemView, language: string) {
  const languageSignature = getPracticeLanguageSignature(view, language);
  if (languageSignature?.callableName) return languageSignature.callableName;
  return view.functionSignature?.functionName ?? null;
}

export function buildPracticeVisibleTestRunInput(
  view: PracticeProblemView,
  language: string,
): PracticeVisibleTestRunInput | undefined {
  if (!view.visibleTests.length) return undefined;
  const functionName = getPracticeCallableName(view, language);
  if (!functionName) return undefined;

  return {
    functionName,
    visibleTests: view.visibleTests,
  };
}
