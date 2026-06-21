import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  buildPracticeGenerationRepairPrompt,
  runPracticeGenerationWithRepair,
} from "@/lib/practice-generation-repair.server";

const schema = z.object({ title: z.string() });

describe("practice generation repair", () => {
  it("returns the first valid result without a repair attempt", async () => {
    const runWorkflow = vi.fn(async () => ({ ok: true as const, data: { title: "Valid" } }));

    const result = await runPracticeGenerationWithRepair({
      runWorkflow,
      systemPrompt: "system",
      userPrompt: "user",
      schema,
      malformedError: "Safe error.",
    });

    expect(result).toEqual({ ok: true, data: { title: "Valid" }, repaired: false });
    expect(runWorkflow).toHaveBeenCalledTimes(1);
    expect(runWorkflow.mock.calls[0]?.[0].maxAttempts).toBe(1);
  });

  it("runs one repair prompt for malformed raw content", async () => {
    const runWorkflow = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false as const,
        error: "Safe error.",
        rawContent: '{"title":1}',
      })
      .mockResolvedValueOnce({ ok: true as const, data: { title: "Repaired" } });

    const result = await runPracticeGenerationWithRepair({
      runWorkflow,
      systemPrompt: "system",
      userPrompt: "original user prompt",
      schema,
      malformedError: "Safe error.",
    });

    expect(result).toEqual({ ok: true, data: { title: "Repaired" }, repaired: true });
    expect(runWorkflow).toHaveBeenCalledTimes(2);
    expect(runWorkflow.mock.calls[0]?.[0].maxAttempts).toBe(1);
    expect(runWorkflow.mock.calls[1]?.[0].maxAttempts).toBe(1);
    expect(runWorkflow.mock.calls[1]?.[0].userPrompt).toContain(
      "Repair the previous structured practice problem response.",
    );
    expect(runWorkflow.mock.calls[1]?.[0].userPrompt).toContain("original user prompt");
    expect(runWorkflow.mock.calls[1]?.[0].userPrompt).toContain('{"title":1}');
  });

  it("does not repair gateway or status failures", async () => {
    const runWorkflow = vi.fn(async () => ({
      ok: false as const,
      error: "Rate limited. Try again in a minute.",
      status: 429,
    }));

    const result = await runPracticeGenerationWithRepair({
      runWorkflow,
      systemPrompt: "system",
      userPrompt: "user",
      schema,
      malformedError: "Safe error.",
    });

    expect(result).toEqual({
      ok: false,
      error: "Rate limited. Try again in a minute.",
      status: 429,
    });
    expect(runWorkflow).toHaveBeenCalledTimes(1);
  });

  it("returns a safe error when the repair attempt also fails", async () => {
    const runWorkflow = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false as const,
        error: "Safe error.",
        rawContent: "{}",
      })
      .mockResolvedValueOnce({
        ok: false as const,
        error: "Different parse detail",
        rawContent: "not json",
      });

    const result = await runPracticeGenerationWithRepair({
      runWorkflow,
      systemPrompt: "system",
      userPrompt: "user",
      schema,
      malformedError: "Safe error.",
    });

    expect(result).toEqual({
      ok: false,
      error: "Safe error.",
      rawContent: "not json",
      status: undefined,
    });
    expect(runWorkflow).toHaveBeenCalledTimes(2);
  });

  it("truncates invalid raw content in the repair prompt", () => {
    const repairPrompt = buildPracticeGenerationRepairPrompt({
      originalUserPrompt: "user",
      rawContent: "x".repeat(7000),
    });

    expect(repairPrompt).toContain("user");
    expect(repairPrompt).toContain("x".repeat(6000));
    expect(repairPrompt).not.toContain("x".repeat(6001));
  });
});
