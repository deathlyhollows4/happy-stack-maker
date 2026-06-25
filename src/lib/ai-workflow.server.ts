import { z } from "zod";
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
  | { ok: false; error: string; status?: number; rawContent?: string; diagnosticId?: string }
> {
  const maxAttempts = input.maxAttempts ?? 3;
  let content = "{}";
  let lastDiagnosticId: string | undefined;

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
      lastDiagnosticId = buildAiDiagnosticId(input.flowName);
      console.error(`${input.flowName} parse attempt failed`, {
        diagnosticId: lastDiagnosticId,
        attempt,
        maxAttempts,
        issues: summarizeParseError(parseErr),
        rawPreview: redactAiContentPreview(content),
        rawHash: hashDiagnosticContent(content),
      });

      if (attempt < maxAttempts) {
        const baseDelay = Math.pow(2, attempt - 1) * 1000;
        const jitter = Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter));
      }
    }
  }

  const diagnosticId = lastDiagnosticId ?? buildAiDiagnosticId(input.flowName);
  console.error(`${input.flowName}: malformed AI output after retries`, {
    diagnosticId,
    maxAttempts,
    rawPreview: redactAiContentPreview(content),
    rawHash: hashDiagnosticContent(content),
  });
  return {
    ok: false,
    error: formatMalformedError(input.malformedError, diagnosticId),
    rawContent: content,
    diagnosticId,
  };
}

function buildAiDiagnosticId(flowName: string) {
  const safeFlowName = flowName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8).padEnd(6, "0");
  return `${safeFlowName || "ai"}-${Date.now().toString(36)}-${suffix}`;
}

function formatMalformedError(message: string, diagnosticId: string) {
  return `${message} Reference: ${diagnosticId}.`;
}

function redactAiContentPreview(content: string) {
  return content
    .slice(0, 240)
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(
      /(["']?(?:api[_-]?key|token|secret|password)["']?\s*[:=]\s*)["'][^"']{1,160}["']/gi,
      "$1[redacted]",
    )
    .replace(
      /((?:api[_-]?key|token|secret|password)\s+)["']?[A-Za-z0-9._-]{4,160}["']?/gi,
      "$1[redacted]",
    );
}

function hashDiagnosticContent(content: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function summarizeParseError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues.slice(0, 10).map((issue) => ({
      path: issue.path.length ? issue.path.join(".") : "root",
      message: issue.message,
      code: issue.code,
    }));
  }

  if (error instanceof SyntaxError) {
    return [{ path: "json", message: error.message, code: "invalid_json" }];
  }

  if (error instanceof Error) {
    return [{ path: "unknown", message: error.message, code: "parse_error" }];
  }

  return [{ path: "unknown", message: "Unknown parse error.", code: "parse_error" }];
}
