import {
  mapProgressRowsForPracticePlanner,
  planPracticeSession,
  type PracticePlannerSource,
  type PracticePlannerProgressRow,
  type PracticePlannerRequest,
  type PracticePlannerResult,
} from "@/lib/practice-planner.server";
import { normalizeTopicSlug, type TopicSlug } from "@/lib/topics";

export interface PracticeGenerationPlanRequest {
  topicSlug?: string | null;
  progressRows?: readonly PracticePlannerProgressRow[];
  completedCurriculumNodeIds?: readonly string[];
  masteredTopicSlugs?: readonly string[];
  now?: Date | string;
  prerequisiteMasteryThreshold?: number;
}

export interface PracticeProblemInsertPlan {
  topic_slug: TopicSlug | null;
  curriculum_node_id: string;
  mastery_band: string;
  objective: string;
  planning_context: PracticePlanningContext;
}

export interface PracticePlanningBridgePreview {
  targetTopicSlug: TopicSlug | null;
  targetCurriculumNodeId: string;
  targetCurriculumNodeTitle: string;
  targetMasteryBand: string;
}

export interface PracticePlanningContext {
  source: PracticePlannerSource;
  requestedTopicSlug: TopicSlug | null;
  selectedTopicSlug: TopicSlug | null;
  selectedCurriculumNodeId: string;
  selectedCurriculumNodeTitle: string;
  selectedMasteryBand: string;
  bridgePreview: PracticePlanningBridgePreview | null;
}

export interface PracticeGenerationPlan {
  requestedTopicSlug: TopicSlug | null;
  topicSlug: TopicSlug | null;
  aiPromptTopicSlug: TopicSlug | null;
  practicePlan: PracticePlannerResult;
  problemInsertPlan: PracticeProblemInsertPlan;
}

export function buildPracticeGenerationPlan(
  request: PracticeGenerationPlanRequest,
): PracticeGenerationPlan {
  const requestedTopicSlug = normalizeTopicSlug(request.topicSlug);
  const plannerRequest: PracticePlannerRequest = {
    topicSlug: requestedTopicSlug,
    progress: mapProgressRowsForPracticePlanner(request.progressRows ?? []),
    completedCurriculumNodeIds: request.completedCurriculumNodeIds,
    masteredTopicSlugs: request.masteredTopicSlugs,
    now: request.now,
    prerequisiteMasteryThreshold: request.prerequisiteMasteryThreshold,
  };
  const practicePlan = planPracticeSession(plannerRequest);
  const topicSlug = practicePlan.topicSlug;

  return {
    requestedTopicSlug,
    topicSlug,
    aiPromptTopicSlug: topicSlug,
    practicePlan,
    problemInsertPlan: {
      topic_slug: topicSlug,
      curriculum_node_id: practicePlan.node.id,
      mastery_band: practicePlan.masteryBand.id,
      objective: practicePlan.node.objective,
      planning_context: buildPracticePlanningContext(practicePlan),
    },
  };
}

function buildPracticePlanningContext(
  practicePlan: PracticePlannerResult,
): PracticePlanningContext {
  return {
    source: practicePlan.source,
    requestedTopicSlug: practicePlan.requestedTopicSlug,
    selectedTopicSlug: practicePlan.topicSlug,
    selectedCurriculumNodeId: practicePlan.node.id,
    selectedCurriculumNodeTitle: practicePlan.node.title,
    selectedMasteryBand: practicePlan.masteryBand.id,
    bridgePreview: practicePlan.preview
      ? {
          targetTopicSlug: practicePlan.preview.topicSlug,
          targetCurriculumNodeId: practicePlan.preview.node.id,
          targetCurriculumNodeTitle: practicePlan.preview.node.title,
          targetMasteryBand: practicePlan.preview.masteryBand.id,
        }
      : null,
  };
}
