import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserPlan, consumeQuota, getPlanQuotas, dayKey } from "@/lib/entitlements.server";
import type { PaymentsEnv } from "@/lib/payments.server";
import { envInput } from "@/lib/codewise.utils";
import { PracticeProblemLanguageSchema } from "@/lib/practice-problem-contract";
import { PracticeReviewQualityInputSchema } from "@/lib/practice-event-model";
import { runPracticeAttemptLifecycle } from "@/lib/practice-attempt-lifecycle.server";

const SubmitPracticeAttemptInputSchema = z
  .object({
    practiceProblemId: z.string().uuid(),
    code: z.string().min(1).max(20_000),
    language: PracticeProblemLanguageSchema,
    hintCount: z.number().int().min(0).max(5).default(0),
    startedAt: z.string().datetime().optional(),
    reviewQuality: PracticeReviewQualityInputSchema.optional(),
    environment: envInput as z.ZodType<PaymentsEnv>,
  })
  .strict();

export const submitPracticeAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitPracticeAttemptInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { plan } = await getUserPlan(userId, data.environment);
    const limit = (await getPlanQuotas())[plan].codeRunsPerDay;
    const allowed = await consumeQuota(userId, "code_run", limit, dayKey());
    if (!allowed) {
      return {
        ok: false as const,
        error: `Daily code-run limit reached (${limit}/day). Resets at UTC midnight.`,
      };
    }

    return await runPracticeAttemptLifecycle({
      supabase,
      userId,
      practiceProblemId: data.practiceProblemId,
      code: data.code,
      language: data.language,
      hintCount: data.hintCount,
      startedAt: data.startedAt,
      reviewQuality: data.reviewQuality,
    });
  });
