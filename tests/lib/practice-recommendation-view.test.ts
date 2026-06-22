import { describe, expect, it } from "vitest";
import { buildPracticeRecommendationView } from "@/lib/practice-recommendation-view";

describe("practice recommendation view", () => {
  it("starts a true beginner at the first curriculum node", () => {
    const view = buildPracticeRecommendationView({ progressRows: [] });

    expect(view.source).toBe("beginner-start");
    expect(view.currentMastery).toBeNull();
    expect(view.nextNode).toMatchObject({
      curriculumNodeId: "foundation-io",
      title: "Input, Output, And Values",
      masteryBandId: "0-20",
      masteryBandLabel: "Concept drill",
    });
    expect(view.bridgePreview).toBeNull();
  });

  it("shows the weakest topic mastery band and next node for auto practice", () => {
    const view = buildPracticeRecommendationView({
      completedCurriculumNodeIds: ["foundation-complexity"],
      masteredTopicSlugs: ["complexity"],
      now: "2026-06-22T00:00:00.000Z",
      progressRows: [
        {
          topic_slug: "arrays",
          mastery: 0.3,
          attempts: 2,
          next_review_date: null,
          last_reviewed: null,
          retrievability: null,
        },
        {
          topic_slug: "strings",
          mastery: 0.7,
          attempts: 5,
          next_review_date: null,
          last_reviewed: null,
          retrievability: null,
        },
      ],
    });

    expect(view.source).toBe("weakest-topic");
    expect(view.currentMastery).toMatchObject({
      topicSlug: "arrays",
      topicLabel: "Arrays",
      masteryPercent: 30,
      bandId: "21-40",
      bandLabel: "Guided easy",
    });
    expect(view.nextNode).toMatchObject({
      curriculumNodeId: "arrays-basics",
      topicSlug: "arrays",
      masteryBandId: "21-40",
    });
  });

  it("uses due review before weakest topic", () => {
    const view = buildPracticeRecommendationView({
      completedCurriculumNodeIds: ["arrays-basics"],
      masteredTopicSlugs: ["arrays"],
      now: "2026-06-22T00:00:00.000Z",
      progressRows: [
        {
          topic_slug: "arrays",
          mastery: 0.1,
          attempts: 4,
          next_review_date: null,
          last_reviewed: null,
          retrievability: null,
        },
        {
          topic_slug: "strings",
          mastery: 0.65,
          attempts: 2,
          next_review_date: "2026-06-21T00:00:00.000Z",
          last_reviewed: null,
          retrievability: 0.5,
        },
      ],
    });

    expect(view.source).toBe("due-review");
    expect(view.currentMastery).toMatchObject({
      topicSlug: "strings",
      masteryPercent: 65,
      bandId: "61-80",
    });
    expect(view.nextNode).toMatchObject({
      curriculumNodeId: "strings-basics",
      topicSlug: "strings",
      masteryBandId: "61-80",
    });
  });

  it("shows manual topic bridge preview without exposing hidden-test detail", () => {
    const view = buildPracticeRecommendationView({
      topicSlug: "two-pointers",
      progressRows: [
        {
          topic_slug: "two-pointers",
          mastery: 0.1,
          attempts: 1,
          next_review_date: null,
          last_reviewed: null,
          retrievability: null,
        },
      ],
    });

    expect(view.source).toBe("manual-topic");
    expect(view.currentMastery).toMatchObject({
      topicSlug: "two-pointers",
      masteryPercent: 10,
      bandId: "0-20",
    });
    expect(view.nextNode).toMatchObject({
      curriculumNodeId: "foundation-io",
      topicLabel: "Foundation",
      masteryBandId: "0-20",
    });
    expect(view.bridgePreview).toMatchObject({
      curriculumNodeId: "two-pointers-basics",
      topicSlug: "two-pointers",
      masteryBandId: "21-40",
    });
    expect(JSON.stringify(view)).not.toContain("hidden");
  });
});
