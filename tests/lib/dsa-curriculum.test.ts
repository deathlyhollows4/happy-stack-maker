import { describe, expect, it } from "vitest";
import {
  getCurriculumGateStatus,
  getCurriculumNodeById,
  getCurriculumNodesForTopic,
  getFirstCurriculumNode,
  getMasteryBandForScore,
  validateCurriculumBandSupport,
} from "@/lib/dsa-curriculum";

describe("CodeWise DSA curriculum", () => {
  it("looks up nodes by id and returns the beginner starting node", () => {
    expect(getCurriculumNodeById("arrays-basics")?.title).toBe("Array Traversal Basics");
    expect(getCurriculumNodeById("missing-node")).toBeNull();
    expect(getFirstCurriculumNode().id).toBe("foundation-io");
  });

  it("finds curriculum nodes for a topic", () => {
    const arrayNodes = getCurriculumNodesForTopic("arrays");

    expect(arrayNodes.map((node) => node.id)).toContain("arrays-basics");
    expect(arrayNodes.every((node) => node.primaryTopicSlug === "arrays")).toBe(true);
  });

  it("reports prerequisite gaps before opening a curriculum node", () => {
    const arrayNode = getCurriculumNodeById("arrays-basics");
    expect(arrayNode).not.toBeNull();

    const gate = getCurriculumGateStatus(arrayNode!, [], []);

    expect(gate).toEqual({
      isOpen: false,
      missingPrerequisiteNodeIds: ["foundation-complexity"],
      missingPrerequisiteTopicSlugs: ["complexity"],
    });
  });

  it("opens a curriculum node when node and topic prerequisites are met", () => {
    const arrayNode = getCurriculumNodeById("arrays-basics");
    expect(arrayNode).not.toBeNull();

    const gate = getCurriculumGateStatus(arrayNode!, ["foundation-complexity"], ["complexity"]);

    expect(gate).toEqual({
      isOpen: true,
      missingPrerequisiteNodeIds: [],
      missingPrerequisiteTopicSlugs: [],
    });
  });

  it("selects mastery bands from clamped score boundaries", () => {
    expect(getMasteryBandForScore(undefined).id).toBe("0-20");
    expect(getMasteryBandForScore(-1).id).toBe("0-20");
    expect(getMasteryBandForScore(0.2).id).toBe("0-20");
    expect(getMasteryBandForScore(0.21).id).toBe("21-40");
    expect(getMasteryBandForScore(0.6).id).toBe("41-60");
    expect(getMasteryBandForScore(0.81).id).toBe("81-100");
    expect(getMasteryBandForScore(2).id).toBe("81-100");
  });

  it("accepts supported topic and mastery-band combinations", () => {
    const result = validateCurriculumBandSupport("arrays", "0-20");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.node.id).toBe("arrays-basics");
      expect(result.band.id).toBe("0-20");
    }
  });

  it("rejects unsupported topic and mastery-band combinations", () => {
    const result = validateCurriculumBandSupport("two-pointers", "0-20");

    expect(result).toEqual({
      ok: false,
      reason: "unsupported-band",
      message: "Topic two-pointers does not support mastery band 0-20.",
      supportedBands: ["21-40", "41-60", "61-80", "81-100"],
    });
  });

  it("rejects topics that are outside the curriculum", () => {
    const result = validateCurriculumBandSupport("unknown-topic", "41-60");

    expect(result).toEqual({
      ok: false,
      reason: "unsupported-topic",
      message: "No curriculum node is available for topic unknown-topic.",
      supportedBands: [],
    });
  });
});
