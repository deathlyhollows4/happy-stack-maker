import {
  CODEWISE_DSA_LADDER,
  type CurriculumGateStatus,
  type CurriculumNode,
  type MasteryBand,
  type MasteryBandId,
  getCurriculumGateStatus,
  getCurriculumNodeById,
  getCurriculumNodesForTopic,
  getFirstCurriculumNode,
  getMasteryBandById,
  getMasteryBandForScore,
  isSupportedBandForNode,
} from "@/lib/dsa-curriculum";
import { normalizeTopicSlug, type TopicSlug } from "@/lib/topics";

const DEFAULT_PREREQUISITE_MASTERY = 0.8;

export interface PracticePlannerProgress {
  topicSlug: string | null;
  mastery: number | null;
  attempts?: number | null;
  nextReviewDate?: string | null;
  lastReviewed?: string | null;
  retrievability?: number | null;
}

export interface PracticePlannerRequest {
  topicSlug?: string | null;
  progress?: readonly PracticePlannerProgress[];
  completedCurriculumNodeIds?: readonly string[];
  masteredTopicSlugs?: readonly string[];
  now?: Date | string;
  prerequisiteMasteryThreshold?: number;
}

export type PracticePlannerSource =
  | "manual-topic"
  | "due-review"
  | "weakest-topic"
  | "beginner-start";

export interface PracticePlannerPreview {
  node: CurriculumNode;
  topicSlug: TopicSlug | null;
  masteryBand: MasteryBand;
  gateStatus: CurriculumGateStatus;
}

export interface PracticePlannerResult {
  source: PracticePlannerSource;
  node: CurriculumNode;
  topicSlug: TopicSlug | null;
  masteryBand: MasteryBand;
  gateStatus: CurriculumGateStatus;
  requestedTopicSlug: TopicSlug | null;
  dueReviewTopicSlug: TopicSlug | null;
  preview: PracticePlannerPreview | null;
  rationale: string[];
}

interface NormalizedProgress {
  topicSlug: TopicSlug;
  mastery: number;
  attempts: number;
  nextReviewDate: string | null;
  lastReviewed: string | null;
  retrievability: number | null;
}

interface TargetSelection {
  source: PracticePlannerSource;
  node: CurriculumNode;
  requestedTopicSlug: TopicSlug | null;
  dueReviewTopicSlug: TopicSlug | null;
  rationale: string[];
}

export function planPracticeSession(request: PracticePlannerRequest): PracticePlannerResult {
  const now = normalizeDate(request.now) ?? new Date();
  const progressByTopic = normalizeProgress(request.progress ?? []);
  const completedNodeIds = new Set(request.completedCurriculumNodeIds ?? []);
  const masteredTopicSlugs = buildMasteredTopicSet(
    progressByTopic,
    request.masteredTopicSlugs ?? [],
    request.prerequisiteMasteryThreshold ?? DEFAULT_PREREQUISITE_MASTERY,
  );

  const target = selectTargetNode(request.topicSlug, progressByTopic, now);
  const resolved = resolveTargetNode(target.node, completedNodeIds, masteredTopicSlugs);
  const nodeTopicSlug = resolved.node.primaryTopicSlug;
  const masteryBand = chooseSupportedBandForNode(
    resolved.node,
    getMasteryBandForScore(getMasteryForTopic(progressByTopic, nodeTopicSlug)),
  );
  const gateStatus = getCurriculumGateStatus(resolved.node, completedNodeIds, masteredTopicSlugs);

  const targetTopicSlug = target.node.primaryTopicSlug ?? target.requestedTopicSlug;
  const targetMasteryBand = chooseSupportedBandForNode(
    target.node,
    getMasteryBandForScore(getMasteryForTopic(progressByTopic, targetTopicSlug)),
  );
  const targetGateStatus = getCurriculumGateStatus(
    target.node,
    completedNodeIds,
    masteredTopicSlugs,
  );
  const preview =
    resolved.node.id === target.node.id
      ? null
      : {
          node: target.node,
          topicSlug: targetTopicSlug,
          masteryBand: targetMasteryBand,
          gateStatus: targetGateStatus,
        };

  const rationale = [...target.rationale];
  if (preview) {
    rationale.push(`Selected prerequisite bridge ${resolved.node.id} before ${target.node.id}.`);
  }
  if (
    !isSupportedBandForNode(
      resolved.node,
      getMasteryBandForScore(getMasteryForTopic(progressByTopic, nodeTopicSlug)).id,
    )
  ) {
    rationale.push(`Adjusted mastery band to ${masteryBand.id} for ${resolved.node.id}.`);
  }

  return {
    source: target.source,
    node: resolved.node,
    topicSlug: nodeTopicSlug,
    masteryBand,
    gateStatus,
    requestedTopicSlug: target.requestedTopicSlug,
    dueReviewTopicSlug: target.dueReviewTopicSlug,
    preview,
    rationale,
  };
}

function selectTargetNode(
  requestedTopicSlug: string | null | undefined,
  progressByTopic: Map<TopicSlug, NormalizedProgress>,
  now: Date,
): TargetSelection {
  const manualTopicSlug = normalizeTopicSlug(requestedTopicSlug);

  if (manualTopicSlug) {
    const manualNode = getFirstNodeForTopic(manualTopicSlug);
    if (manualNode) {
      return {
        source: "manual-topic",
        node: manualNode,
        requestedTopicSlug: manualTopicSlug,
        dueReviewTopicSlug: null,
        rationale: [`Manual topic requested: ${manualTopicSlug}.`],
      };
    }
  }

  const dueReview = getDueReviewProgress(progressByTopic, now);
  if (dueReview) {
    const dueNode = getFirstNodeForTopic(dueReview.topicSlug);
    if (dueNode) {
      return {
        source: "due-review",
        node: dueNode,
        requestedTopicSlug: dueReview.topicSlug,
        dueReviewTopicSlug: dueReview.topicSlug,
        rationale: [`Due review selected: ${dueReview.topicSlug}.`],
      };
    }
  }

  const weakest = getWeakestProgress(progressByTopic);
  if (weakest) {
    const weakestNode = getFirstNodeForTopic(weakest.topicSlug);
    if (weakestNode) {
      return {
        source: "weakest-topic",
        node: weakestNode,
        requestedTopicSlug: weakest.topicSlug,
        dueReviewTopicSlug: null,
        rationale: [`Weakest topic selected: ${weakest.topicSlug}.`],
      };
    }
  }

  const firstNode = getFirstCurriculumNode();
  return {
    source: "beginner-start",
    node: firstNode,
    requestedTopicSlug: firstNode.primaryTopicSlug,
    dueReviewTopicSlug: null,
    rationale: ["No usable topic signal found, starting at the first curriculum node."],
  };
}

function resolveTargetNode(
  targetNode: CurriculumNode,
  completedNodeIds: ReadonlySet<string>,
  masteredTopicSlugs: ReadonlySet<TopicSlug>,
): { node: CurriculumNode } {
  const gateStatus = getCurriculumGateStatus(targetNode, completedNodeIds, masteredTopicSlugs);
  if (gateStatus.isOpen) return { node: targetNode };

  const bridgeNode = findFirstOpenPrerequisiteNode(
    targetNode,
    completedNodeIds,
    masteredTopicSlugs,
    new Set(),
  );

  return { node: bridgeNode ?? getFirstCurriculumNode() };
}

function findFirstOpenPrerequisiteNode(
  targetNode: CurriculumNode,
  completedNodeIds: ReadonlySet<string>,
  masteredTopicSlugs: ReadonlySet<TopicSlug>,
  visitedNodeIds: Set<string>,
): CurriculumNode | null {
  if (visitedNodeIds.has(targetNode.id)) return null;
  visitedNodeIds.add(targetNode.id);

  const gateStatus = getCurriculumGateStatus(targetNode, completedNodeIds, masteredTopicSlugs);
  if (gateStatus.isOpen) return targetNode;

  for (const missingNodeId of gateStatus.missingPrerequisiteNodeIds) {
    const prerequisiteNode = getCurriculumNodeById(missingNodeId);
    if (!prerequisiteNode) continue;

    const openNode = findFirstOpenPrerequisiteNode(
      prerequisiteNode,
      completedNodeIds,
      masteredTopicSlugs,
      visitedNodeIds,
    );
    if (openNode) return openNode;
  }

  for (const missingTopicSlug of gateStatus.missingPrerequisiteTopicSlugs) {
    const prerequisiteNode = getFirstNodeForTopic(missingTopicSlug);
    if (!prerequisiteNode) continue;

    const openNode = findFirstOpenPrerequisiteNode(
      prerequisiteNode,
      completedNodeIds,
      masteredTopicSlugs,
      visitedNodeIds,
    );
    if (openNode) return openNode;
  }

  return null;
}

function chooseSupportedBandForNode(node: CurriculumNode, requestedBand: MasteryBand): MasteryBand {
  if (isSupportedBandForNode(node, requestedBand.id)) return requestedBand;
  return getMasteryBandById(node.supportedBands[0] ?? "0-20");
}

function getFirstNodeForTopic(topicSlug: TopicSlug): CurriculumNode | null {
  return getCurriculumNodesForTopic(topicSlug)[0] ?? null;
}

function getMasteryForTopic(
  progressByTopic: ReadonlyMap<TopicSlug, NormalizedProgress>,
  topicSlug: TopicSlug | null,
): number | null {
  if (!topicSlug) return null;
  return progressByTopic.get(topicSlug)?.mastery ?? null;
}

function normalizeProgress(
  progress: readonly PracticePlannerProgress[],
): Map<TopicSlug, NormalizedProgress> {
  const progressByTopic = new Map<TopicSlug, NormalizedProgress>();

  for (const entry of progress) {
    const topicSlug = normalizeTopicSlug(entry.topicSlug);
    if (!topicSlug) continue;

    const normalizedEntry: NormalizedProgress = {
      topicSlug,
      mastery: clampMastery(entry.mastery),
      attempts: Math.max(0, entry.attempts ?? 0),
      nextReviewDate: entry.nextReviewDate ?? null,
      lastReviewed: entry.lastReviewed ?? null,
      retrievability: entry.retrievability ?? null,
    };
    const existingEntry = progressByTopic.get(topicSlug);

    if (!existingEntry || normalizedEntry.mastery < existingEntry.mastery) {
      progressByTopic.set(topicSlug, normalizedEntry);
    }
  }

  return progressByTopic;
}

function buildMasteredTopicSet(
  progressByTopic: ReadonlyMap<TopicSlug, NormalizedProgress>,
  explicitMasteredTopicSlugs: readonly string[],
  prerequisiteMasteryThreshold: number,
): Set<TopicSlug> {
  const masteredTopicSlugs = new Set<TopicSlug>();

  for (const topicSlug of explicitMasteredTopicSlugs) {
    const normalized = normalizeTopicSlug(topicSlug);
    if (normalized) masteredTopicSlugs.add(normalized);
  }

  for (const progress of progressByTopic.values()) {
    if (progress.mastery >= prerequisiteMasteryThreshold) {
      masteredTopicSlugs.add(progress.topicSlug);
    }
  }

  return masteredTopicSlugs;
}

function getDueReviewProgress(
  progressByTopic: ReadonlyMap<TopicSlug, NormalizedProgress>,
  now: Date,
): NormalizedProgress | null {
  const nowMs = now.getTime();
  const dueProgress = [...progressByTopic.values()]
    .filter((progress) => {
      const nextReview = normalizeDate(progress.nextReviewDate);
      return nextReview ? nextReview.getTime() <= nowMs : false;
    })
    .sort((a, b) => {
      const aNextReview = normalizeDate(a.nextReviewDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bNextReview = normalizeDate(b.nextReviewDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (aNextReview !== bNextReview) return aNextReview - bNextReview;

      const aRetrievability = a.retrievability ?? 1;
      const bRetrievability = b.retrievability ?? 1;
      if (aRetrievability !== bRetrievability) return aRetrievability - bRetrievability;

      return a.mastery - b.mastery;
    });

  return dueProgress[0] ?? null;
}

function getWeakestProgress(
  progressByTopic: ReadonlyMap<TopicSlug, NormalizedProgress>,
): NormalizedProgress | null {
  return (
    [...progressByTopic.values()].sort((a, b) => {
      if (a.mastery !== b.mastery) return a.mastery - b.mastery;
      return b.attempts - a.attempts;
    })[0] ?? null
  );
}

function normalizeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampMastery(value: number | null | undefined): number {
  return Math.max(0, Math.min(1, value ?? 0));
}

export const PRACTICE_PLANNER_CURRICULUM_NODE_COUNT = CODEWISE_DSA_LADDER.length;
