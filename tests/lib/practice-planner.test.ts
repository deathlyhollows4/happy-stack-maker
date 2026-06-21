import { describe, expect, it } from "vitest";
import { planPracticeSession } from "@/lib/practice-planner.server";

describe("practice planner", () => {
  it("starts true beginners at the first curriculum node", () => {
    const plan = planPracticeSession({});

    expect(plan.source).toBe("beginner-start");
    expect(plan.node.id).toBe("foundation-io");
    expect(plan.masteryBand.id).toBe("0-20");
    expect(plan.preview).toBeNull();
  });

  it("bridges a manual advanced topic through the earliest open prerequisite", () => {
    const plan = planPracticeSession({
      topicSlug: "two-pointers",
      progress: [{ topicSlug: "two-pointers", mastery: 0.1 }],
    });

    expect(plan.source).toBe("manual-topic");
    expect(plan.requestedTopicSlug).toBe("two-pointers");
    expect(plan.node.id).toBe("foundation-io");
    expect(plan.preview?.node.id).toBe("two-pointers-basics");
    expect(plan.preview?.gateStatus.missingPrerequisiteNodeIds).toEqual([
      "arrays-basics",
      "strings-basics",
    ]);
    expect(plan.rationale).toContain(
      "Selected prerequisite bridge foundation-io before two-pointers-basics.",
    );
  });

  it("uses due review before weakest topic when auto planning", () => {
    const plan = planPracticeSession({
      now: "2026-06-21T00:00:00.000Z",
      completedCurriculumNodeIds: ["arrays-basics"],
      masteredTopicSlugs: ["arrays"],
      progress: [
        { topicSlug: "arrays", mastery: 0.1, attempts: 4 },
        {
          topicSlug: "strings",
          mastery: 0.65,
          attempts: 2,
          nextReviewDate: "2026-06-20T00:00:00.000Z",
          retrievability: 0.5,
        },
      ],
    });

    expect(plan.source).toBe("due-review");
    expect(plan.dueReviewTopicSlug).toBe("strings");
    expect(plan.node.id).toBe("strings-basics");
    expect(plan.masteryBand.id).toBe("61-80");
    expect(plan.preview).toBeNull();
  });

  it("uses the weakest topic when no due review exists", () => {
    const plan = planPracticeSession({
      now: "2026-06-21T00:00:00.000Z",
      completedCurriculumNodeIds: ["foundation-complexity"],
      masteredTopicSlugs: ["complexity"],
      progress: [
        { topicSlug: "arrays", mastery: 0.3, attempts: 1 },
        { topicSlug: "strings", mastery: 0.7, attempts: 5 },
      ],
    });

    expect(plan.source).toBe("weakest-topic");
    expect(plan.requestedTopicSlug).toBe("arrays");
    expect(plan.node.id).toBe("arrays-basics");
    expect(plan.masteryBand.id).toBe("21-40");
    expect(plan.gateStatus.isOpen).toBe(true);
  });

  it("adjusts unsupported mastery bands to the lowest band supported by the node", () => {
    const plan = planPracticeSession({
      topicSlug: "two-pointers",
      completedCurriculumNodeIds: ["arrays-basics", "strings-basics"],
      masteredTopicSlugs: ["arrays", "strings"],
      progress: [{ topicSlug: "two-pointers", mastery: 0.05 }],
    });

    expect(plan.source).toBe("manual-topic");
    expect(plan.node.id).toBe("two-pointers-basics");
    expect(plan.masteryBand.id).toBe("21-40");
    expect(plan.rationale).toContain("Adjusted mastery band to 21-40 for two-pointers-basics.");
  });

  it("falls back to beginner start when a manual topic is unknown", () => {
    const plan = planPracticeSession({
      topicSlug: "unknown-topic",
      progress: [],
    });

    expect(plan.source).toBe("beginner-start");
    expect(plan.requestedTopicSlug).toBeNull();
    expect(plan.node.id).toBe("foundation-io");
  });
});
