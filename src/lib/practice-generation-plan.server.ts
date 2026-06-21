import {
  mapProgressRowsForPracticePlanner,
  planPracticeSession,
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
  const topicSlug = practicePlan.topicSlug ?? practicePlan.requestedTopicSlug;

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
    },
  };
}
