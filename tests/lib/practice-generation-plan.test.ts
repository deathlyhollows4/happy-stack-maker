import { describe, expect, it } from "vitest";
import { buildPracticeGenerationPlan } from "@/lib/practice-generation-plan.server";

describe("practice generation plan", () => {
  it("builds true-beginner insert metadata for an empty-mastery learner", () => {
    const generationPlan = buildPracticeGenerationPlan({
      progressRows: [],
    });

    expect(generationPlan.requestedTopicSlug).toBeNull();
    expect(generationPlan.topicSlug).toBeNull();
    expect(generationPlan.aiPromptTopicSlug).toBeNull();
    expect(generationPlan.practicePlan.source).toBe("beginner-start");
    expect(generationPlan.practicePlan.node.id).toBe("foundation-io");
    expect(generationPlan.practicePlan.masteryBand.id).toBe("0-20");
    expect(generationPlan.practicePlan.preview).toBeNull();
    expect(generationPlan.problemInsertPlan).toMatchObject({
      topic_slug: null,
      curriculum_node_id: "foundation-io",
      mastery_band: "0-20",
      objective: "Read small values, store them in variables, and return or print a direct result.",
      planning_context: {
        source: "beginner-start",
        requestedTopicSlug: null,
        selectedTopicSlug: null,
        selectedCurriculumNodeId: "foundation-io",
        selectedCurriculumNodeTitle: "Input, Output, And Values",
        selectedMasteryBand: "0-20",
        bridgePreview: null,
      },
    });
  });

  it("builds insert metadata from a manual topic bridge before AI generation", () => {
    const generationPlan = buildPracticeGenerationPlan({
      topicSlug: "two-pointers",
      progressRows: [{ topic_slug: "two-pointers", mastery: 0.1 }],
    });

    expect(generationPlan.requestedTopicSlug).toBe("two-pointers");
    expect(generationPlan.topicSlug).toBeNull();
    expect(generationPlan.aiPromptTopicSlug).toBeNull();
    expect(generationPlan.practicePlan.source).toBe("manual-topic");
    expect(generationPlan.practicePlan.node.id).toBe("foundation-io");
    expect(generationPlan.practicePlan.preview?.node.id).toBe("two-pointers-basics");
    expect(generationPlan.problemInsertPlan).toMatchObject({
      topic_slug: null,
      curriculum_node_id: "foundation-io",
      mastery_band: "0-20",
      objective: "Read small values, store them in variables, and return or print a direct result.",
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
  });

  it("builds insert metadata from weakest-topic auto planning", () => {
    const generationPlan = buildPracticeGenerationPlan({
      completedCurriculumNodeIds: ["foundation-complexity"],
      masteredTopicSlugs: ["complexity"],
      progressRows: [
        { topic_slug: "arrays", mastery: 0.3, attempts: 1 },
        { topic_slug: "strings", mastery: 0.7, attempts: 5 },
      ],
    });

    expect(generationPlan.practicePlan.source).toBe("weakest-topic");
    expect(generationPlan.practicePlan.node.id).toBe("arrays-basics");
    expect(generationPlan.aiPromptTopicSlug).toBe("arrays");
    expect(generationPlan.problemInsertPlan).toMatchObject({
      topic_slug: "arrays",
      curriculum_node_id: "arrays-basics",
      mastery_band: "21-40",
      planning_context: {
        source: "weakest-topic",
        selectedCurriculumNodeId: "arrays-basics",
        bridgePreview: null,
      },
    });
  });
});
