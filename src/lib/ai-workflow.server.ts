import type { z } from "zod";
import { extractJson } from "@/lib/codewise.utils";

type AiWorkflowInput<TSchema extends z.ZodTypeAny> = {
  apiKey: string;
  flowName: string;
  systemPrompt: string;
  userPrompt: string;
  schema: TSchema;
  malformedError: string;
  maxAttempts?: number;
};

async function requestJson(input: { apiKey: string; systemPrompt: string; userPrompt: string }) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("AI gateway error:", response.status, text.slice(0, 500));
    return {
      ok: false as const,
      status: response.status,
      content: null,
    };
  }

  const json = await response.json();
  return {
    ok: true as const,
    status: response.status,
    content: (json?.choices?.[0]?.message?.content ?? "{}") as string,
  };
}

function gatewayError(status: number) {
  if (status === 429) return "Rate limited. Try again in a minute.";
  if (status === 402) return "AI credits exhausted. Add credits in Lovable settings.";
  return "AI service is temporarily unavailable. Please try again.";
}

export async function runJsonAiWorkflow<TSchema extends z.ZodTypeAny>(
  input: AiWorkflowInput<TSchema>,
): Promise<
  | { ok: true; data: z.infer<TSchema> }
  | { ok: false; error: string; status?: number; rawContent?: string }
> {
  const maxAttempts = input.maxAttempts ?? 3;
  let content = "{}";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await requestJson(input);
    if (!result.ok) {
      return { ok: false, error: gatewayError(result.status), status: result.status };
    }

    content = result.content;
    try {
      return {
        ok: true,
        data: input.schema.parse(JSON.parse(extractJson(content))),
      };
    } catch (parseErr) {
      console.error(
        `${input.flowName} parse attempt`,
        attempt,
        "failed:",
        parseErr,
        "content preview:",
        content.slice(0, 200),
      );

      if (attempt < maxAttempts) {
        const baseDelay = Math.pow(2, attempt - 1) * 1000;
        const jitter = Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
      }
    }
  }

  console.error(
    `${input.flowName}: malformed AI output after ${maxAttempts} attempts. Raw preview:`,
    content.slice(0, 500),
  );
  return { ok: false, error: input.malformedError, rawContent: content };
}
