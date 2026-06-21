import type { z } from "zod";

type PracticeGenerationWorkflowInput<TSchema extends z.ZodTypeAny> = {
  systemPrompt: string;
  userPrompt: string;
  schema: TSchema;
  malformedError: string;
  maxAttempts: 1;
};

export type PracticeGenerationWorkflowResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; error: string; status?: number; rawContent?: string };

export type PracticeGenerationWorkflowRunner<TSchema extends z.ZodTypeAny> = (
  input: PracticeGenerationWorkflowInput<TSchema>,
) => Promise<PracticeGenerationWorkflowResult<z.infer<TSchema>>>;

export function buildPracticeGenerationRepairPrompt(input: {
  originalUserPrompt: string;
  rawContent: string;
}) {
  return [
    "Repair the previous structured practice problem response.",
    "Return one valid JSON object only.",
    "Keep the same curriculum node, mastery band, objective, language signatures, tests, hints, and success criteria required by the original request.",
    "Fix missing fields, invalid field values, unsupported bands, extra prose, or invalid JSON.",
    "Original request:",
    input.originalUserPrompt,
    "Previous invalid response:",
    input.rawContent.slice(0, 6000),
  ].join("\n");
}

export async function runPracticeGenerationWithRepair<TSchema extends z.ZodTypeAny>(input: {
  runWorkflow: PracticeGenerationWorkflowRunner<TSchema>;
  systemPrompt: string;
  userPrompt: string;
  schema: TSchema;
  malformedError: string;
}): Promise<PracticeGenerationWorkflowResult<z.infer<TSchema>> & { repaired?: boolean }> {
  const firstAttempt = await input.runWorkflow({
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    schema: input.schema,
    malformedError: input.malformedError,
    maxAttempts: 1,
  });

  if (firstAttempt.ok) {
    return { ...firstAttempt, repaired: false };
  }

  if (firstAttempt.status || !firstAttempt.rawContent) {
    return firstAttempt;
  }

  const repairAttempt = await input.runWorkflow({
    systemPrompt: input.systemPrompt,
    userPrompt: buildPracticeGenerationRepairPrompt({
      originalUserPrompt: input.userPrompt,
      rawContent: firstAttempt.rawContent,
    }),
    schema: input.schema,
    malformedError: input.malformedError,
    maxAttempts: 1,
  });

  if (repairAttempt.ok) {
    return { ...repairAttempt, repaired: true };
  }

  return {
    ok: false,
    error: input.malformedError,
    status: repairAttempt.status,
    rawContent: repairAttempt.rawContent ?? firstAttempt.rawContent,
  };
}
