import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { runJsonAiWorkflow } from "@/lib/ai-workflow.server";

const schema = z.object({ summary: z.string() });

function mockAiResponse(content: string, init?: ResponseInit) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content } }],
    }),
    init,
  );
}

describe("AI workflow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("parses JSON from the gateway response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockAiResponse('{"summary":"ok"}')),
    );

    const result = await runJsonAiWorkflow({
      apiKey: "test-key",
      flowName: "testFlow",
      systemPrompt: "system",
      userPrompt: "user",
      schema,
      malformedError: "Bad JSON",
    });

    expect(result).toEqual({ ok: true, data: { summary: "ok" } });
  });

  it("maps gateway errors to user-safe messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limit", { status: 429 })),
    );

    const result = await runJsonAiWorkflow({
      apiKey: "test-key",
      flowName: "testFlow",
      systemPrompt: "system",
      userPrompt: "user",
      schema,
      malformedError: "Bad JSON",
    });

    expect(result).toEqual({
      ok: false,
      error: "Rate limited. Try again in a minute.",
      status: 429,
    });
  });

  it("retries malformed JSON before returning parsed data", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockAiResponse("not json"))
      .mockResolvedValueOnce(mockAiResponse('{"summary":"retried"}'));
    vi.stubGlobal("fetch", fetchMock);

    const resultPromise = runJsonAiWorkflow({
      apiKey: "test-key",
      flowName: "testFlow",
      systemPrompt: "system",
      userPrompt: "user",
      schema,
      malformedError: "Bad JSON",
      maxAttempts: 2,
    });
    await vi.advanceTimersByTimeAsync(1000);
    const result = await resultPromise;

    expect(result).toEqual({ ok: true, data: { summary: "retried" } });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns a diagnostic id and logs sanitized schema issues for malformed content", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => mockAiResponse('{"summary":1,"token":"secret-value"}')),
    );

    const result = await runJsonAiWorkflow({
      apiKey: "test-key",
      flowName: "testFlow",
      systemPrompt: "system",
      userPrompt: "user",
      schema,
      malformedError: "Bad JSON",
      maxAttempts: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnosticId).toMatch(/^testflow-/);
      expect(result.error).toContain(`Reference: ${result.diagnosticId}.`);
    }
    expect(errorSpy).toHaveBeenCalledWith(
      "testFlow parse attempt failed",
      expect.objectContaining({
        diagnosticId: expect.stringMatching(/^testflow-/),
        issues: [
          expect.objectContaining({
            path: "summary",
            message: "Expected string, received number",
          }),
        ],
        rawPreview: expect.not.stringContaining("secret-value"),
        rawHash: expect.any(String),
      }),
    );
  });
});
