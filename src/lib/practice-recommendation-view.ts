import {
  getMasteryBandForScore,
  type MasteryBandId,
  type CurriculumNode,
} from "@/lib/dsa-curriculum";
import {
  mapProgressRowsForPracticePlanner,
  planPracticeSession,
  type PracticePlannerProgressRow,
  type PracticePlannerSource,
} from "@/lib/practice-planner.server";
import { normalizeTopicSlug, topicDisplayName, type TopicSlug } from "@/lib/topics";

export interface PracticeMasteryBandView {
  topicSlug: TopicSlug;
  topicLabel: string;
  mastery: number;
  masteryPercent: number;
  attempts: number;
  bandId: MasteryBandId;
  bandLabel: string;
}

export interface PracticeRecommendationNodeView {
  curriculumNodeId: string;
  title: string;
  objective: string;
  topicSlug: TopicSlug | null;
  topicLabel: string;
  masteryBandId: MasteryBandId;
  masteryBandLabel: string;
}

export interface PracticeRecommendationView {
  source: PracticePlannerSource;
  sourceLabel: string;
  currentMastery: PracticeMasteryBandView | null;
  nextNode: PracticeRecommendationNodeView;
  bridgePreview: PracticeRecommendationNodeView | null;
  summary: string;
}

export interface BuildPracticeRecommendationViewInput {
  progressRows: readonly PracticePlannerProgressRow[];
  topicSlug?: string | null;
  completedCurriculumNodeIds?: readonly string[];
  masteredTopicSlugs?: readonly string[];
  now?: Date | string;
}

const SOURCE_LABELS: Record<PracticePlannerSource, string> = {
  "manual-topic": "Selected topic",
  "due-review": "Due review",
  "weakest-topic": "Weakest topic",
  "beginner-start": "True beginner start",
};

function clampMastery(value: number | null | undefined) {
  return Math.max(0, Math.min(1, value ?? 0));
}

function buildMasteryBandView(row: PracticePlannerProgressRow): PracticeMasteryBandView | null {
  const topicSlug = normalizeTopicSlug(row.topic_slug);
  if (!topicSlug) return null;

  const mastery = clampMastery(row.mastery);
  const band = getMasteryBandForScore(mastery);

  return {
    topicSlug,
    topicLabel: topicDisplayName(topicSlug),
    mastery,
    masteryPercent: Math.round(mastery * 100),
    attempts: Math.max(0, row.attempts ?? 0),
    bandId: band.id,
    bandLabel: band.label,
  };
}

function buildNodeView(
  node: CurriculumNode,
  topicSlug: TopicSlug | null,
  bandId: MasteryBandId,
  bandLabel: string,
): PracticeRecommendationNodeView {
  return {
    curriculumNodeId: node.id,
    title: node.title,
    objective: node.objective,
    topicSlug,
    topicLabel: topicSlug ? topicDisplayName(topicSlug) : "Foundation",
    masteryBandId: bandId,
    masteryBandLabel: bandLabel,
  };
}

function getProgressForTopic(
  rows: readonly PracticePlannerProgressRow[],
  topicSlug: TopicSlug | null,
) {
  if (!topicSlug) return null;
  return (
    rows.find((row) => {
      const rowTopicSlug = normalizeTopicSlug(row.topic_slug);
      return rowTopicSlug === topicSlug;
    }) ?? null
  );
}

function getWeakestProgress(rows: readonly PracticePlannerProgressRow[]) {
  return (
    rows
      .map(buildMasteryBandView)
      .filter((row): row is PracticeMasteryBandView => Boolean(row))
      .sort((a, b) => {
        if (a.mastery !== b.mastery) return a.mastery - b.mastery;
        return b.attempts - a.attempts;
      })[0] ?? null
  );
}

export function buildPracticeRecommendationView(
  input: BuildPracticeRecommendationViewInput,
): PracticeRecommendationView {
  const plannerProgress = mapProgressRowsForPracticePlanner(input.progressRows);
  const plan = planPracticeSession({
    topicSlug: input.topicSlug,
    progress: plannerProgress,
    completedCurriculumNodeIds: input.completedCurriculumNodeIds,
    masteredTopicSlugs: input.masteredTopicSlugs,
    now: input.now,
  });
  const plannedTopicSlug = plan.topicSlug ?? plan.requestedTopicSlug;
  const selectedProgress = getProgressForTopic(input.progressRows, plannedTopicSlug);
  const currentMastery = selectedProgress
    ? buildMasteryBandView(selectedProgress)
    : getWeakestProgress(input.progressRows);
  const nextNode = buildNodeView(
    plan.node,
    plan.topicSlug,
    plan.masteryBand.id,
    plan.masteryBand.label,
  );
  const bridgePreview = plan.preview
    ? buildNodeView(
        plan.preview.node,
        plan.preview.topicSlug,
        plan.preview.masteryBand.id,
        plan.preview.masteryBand.label,
      )
    : null;
  const summary = bridgePreview
    ? `Start with ${nextNode.title}, then continue toward ${bridgePreview.title}.`
    : `Next recommended node: ${nextNode.title}.`;

  return {
    source: plan.source,
    sourceLabel: SOURCE_LABELS[plan.source],
    currentMastery,
    nextNode,
    bridgePreview,
    summary,
  };
}
