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
  id?: string | null;
  title?: string | null;
  language?: string | null;
  topic_slug?: string | null;
  created_at?: string | null;
  prompt?: string | null;
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

export interface PracticeAttemptSummaryInput {
  id?: string | null;
  practice_problem_id?: string | null;
  language?: string | null;
  status?: string | null;
  visible_tests_passed?: number | null;
  visible_tests_total?: number | null;
  hidden_tests_passed?: number | null;
  hidden_tests_total?: number | null;
  correctness_score?: number | null;
  hint_count?: number | null;
  review_quality_score?: number | null;
  speed_seconds?: number | null;
  completed_at?: string | null;
  created_at?: string | null;
}

export interface PracticeAttemptSummary {
  id: string;
  practiceProblemId: string;
  language: string | null;
  status: "completed" | "failed" | "unknown";
  visible: {
    passed: number;
    total: number;
    failed: number;
  };
  hiddenChecksRun: boolean;
  correctnessPercent: number;
  hintCount: number;
  reviewQualityScore: number | null;
  speedSeconds: number | null;
  completedAt: string | null;
}

export interface PracticeProblemListItem {
  id: string;
  title: string;
  topicSlug: string | null;
  topicLabel: string | null;
  language: string | null;
  createdAt: string | null;
  isStructured: boolean;
  curriculumNodeId: string | null;
  masteryBand: PracticeProblemMasteryBand | null;
  masteryBandLabel: string | null;
  objective: string | null;
  topicTags: PracticeProblemTag[];
  prerequisiteTags: PracticeProblemTag[];
  visibleTestCount: number;
  hiddenThemeCount: number;
  hintCount: number;
  attemptCount: number;
  completedAttemptCount: number;
  attempts: PracticeAttemptSummary[];
  latestAttempt: PracticeAttemptSummary | null;
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

function nonNegativeInteger(input: number | null | undefined): number {
  if (!Number.isFinite(input)) return 0;
  return Math.max(0, Math.floor(input));
}

function clampedPercent(input: number | null | undefined): number {
  if (!Number.isFinite(input)) return 0;
  return Math.round(Math.min(1, Math.max(0, input ?? 0)) * 100);
}

function attemptTime(input: PracticeAttemptSummaryInput) {
  return parseText(input.completed_at) ?? parseText(input.created_at);
}

function timestampMs(input: string | null) {
  const ms = Date.parse(input ?? "");
  return Number.isFinite(ms) ? ms : 0;
}

function compareAttemptSummary(a: PracticeAttemptSummary, b: PracticeAttemptSummary) {
  return timestampMs(b.completedAt) - timestampMs(a.completedAt);
}

function hasStructuredProblemFields(input: {
  statement: string | null;
  objective: string | null;
  examples: PracticeProblemExample[];
  visibleTests: Array<PracticeProblemTestCase & { visibility: "visible" }>;
}) {
  return Boolean(
    input.statement || input.objective || input.examples.length || input.visibleTests.length,
  );
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
  const explicitLegacy = generationStatus === "legacy";
  const isStructured =
    generationStatus === "structured" ||
    contractVersion === PRACTICE_PROBLEM_CONTRACT_VERSION ||
    (!explicitLegacy &&
      hasStructuredProblemFields({
        statement,
        objective,
        examples,
        visibleTests,
      }));

  return {
    isStructured,
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
    examples: isStructured ? examples : [],
    constraints: isStructured ? constraints : [],
    functionSignature: isStructured && functionSignature.success ? functionSignature.data : null,
    visibleTests: isStructured ? visibleTests : [],
    hiddenTestThemes: isStructured ? hiddenTestThemes : [],
    hintLadder: isStructured ? hintLadder : [],
    successCriteria: isStructured ? successCriteria : [],
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
  if (view.isStructured && view.statement) {
    return { kind: "structured", text: view.statement };
  }

  if (!view.isStructured) {
    const legacyBody = view.promptFallback.trim() || view.statement?.trim();
    if (legacyBody) return { kind: "legacy", text: legacyBody };
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

export function buildPracticeAttemptSummary(
  input: PracticeAttemptSummaryInput,
): PracticeAttemptSummary | null {
  const id = parseText(input.id);
  const practiceProblemId = parseText(input.practice_problem_id);
  if (!id || !practiceProblemId) return null;

  const visibleTotal = nonNegativeInteger(input.visible_tests_total);
  const visiblePassed = Math.min(nonNegativeInteger(input.visible_tests_passed), visibleTotal);
  const hiddenTotal = nonNegativeInteger(input.hidden_tests_total);
  const status =
    input.status === "completed" || input.status === "failed" ? input.status : "unknown";

  return {
    id,
    practiceProblemId,
    language: parseText(input.language),
    status,
    visible: {
      passed: visiblePassed,
      total: visibleTotal,
      failed: Math.max(0, visibleTotal - visiblePassed),
    },
    hiddenChecksRun: hiddenTotal > 0 || nonNegativeInteger(input.hidden_tests_passed) > 0,
    correctnessPercent: clampedPercent(input.correctness_score),
    hintCount: nonNegativeInteger(input.hint_count),
    reviewQualityScore: Number.isFinite(input.review_quality_score)
      ? Math.min(1, Math.max(0, input.review_quality_score ?? 0))
      : null,
    speedSeconds: Number.isFinite(input.speed_seconds)
      ? nonNegativeInteger(input.speed_seconds)
      : null,
    completedAt: attemptTime(input),
  };
}

export function buildPracticeProblemListItem(
  problem: PracticeProblemViewInput,
  attempts: PracticeAttemptSummaryInput[] = [],
): PracticeProblemListItem | null {
  const id = parseText(problem.id);
  if (!id) return null;

  const view = buildPracticeProblemView(problem);
  const attemptSummaries = attempts
    .map(buildPracticeAttemptSummary)
    .filter((summary): summary is PracticeAttemptSummary => Boolean(summary))
    .filter((summary) => summary.practiceProblemId === id)
    .sort(compareAttemptSummary);
  const topicSlug = normalizeTopicSlug(problem.topic_slug);

  return {
    id,
    title: parseText(problem.title) ?? "Untitled practice problem",
    topicSlug,
    topicLabel: topicSlug ? topicDisplayName(topicSlug) : null,
    language: parseText(problem.language),
    createdAt: parseText(problem.created_at),
    isStructured: view.isStructured,
    curriculumNodeId: view.curriculumNodeId,
    masteryBand: view.masteryBand,
    masteryBandLabel: view.masteryBandLabel,
    objective: view.objective,
    topicTags: view.topicTags,
    prerequisiteTags: view.prerequisiteTags,
    visibleTestCount: view.visibleTests.length,
    hiddenThemeCount: view.hiddenTestThemes.length,
    hintCount: view.hintLadder.length,
    attemptCount: attemptSummaries.length,
    completedAttemptCount: attemptSummaries.filter((attempt) => attempt.status === "completed")
      .length,
    attempts: attemptSummaries,
    latestAttempt: attemptSummaries[0] ?? null,
  };
}

export function buildPracticeHistoryView(input: {
  problems: PracticeProblemViewInput[];
  attempts?: PracticeAttemptSummaryInput[];
}): PracticeProblemListItem[] {
  const attemptsByProblemId = new Map<string, PracticeAttemptSummaryInput[]>();
  for (const attempt of input.attempts ?? []) {
    const practiceProblemId = parseText(attempt.practice_problem_id);
    if (!practiceProblemId) continue;
    const current = attemptsByProblemId.get(practiceProblemId) ?? [];
    current.push(attempt);
    attemptsByProblemId.set(practiceProblemId, current);
  }

  return input.problems
    .map((problem) =>
      buildPracticeProblemListItem(problem, attemptsByProblemId.get(problem.id ?? "") ?? []),
    )
    .filter((item): item is PracticeProblemListItem => Boolean(item));
}
