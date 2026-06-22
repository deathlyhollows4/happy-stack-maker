import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserPlan, consumeQuota, getPlanQuotas, dayKey } from "@/lib/entitlements.server";
import type { PaymentsEnv } from "@/lib/payments.server";
import {
  buildPracticeExecutionFailure,
  buildPracticeVisibleTestWrapper,
  normalizePracticeExecutionResult,
  PracticeVisibleTestRunInputSchema,
} from "@/lib/practice-test-execution";
import {
  PracticeProblemLanguageSchema,
  type PracticeProblemLanguage,
} from "@/lib/practice-problem-contract";

// Piston runtime mappings. See https://emkc.org/api/v2/piston/runtimes
const PISTON: Record<
  PracticeProblemLanguage,
  { language: string; version: string; filename: string }
> = {
  python: { language: "python", version: "3.10.0", filename: "main.py" },
  javascript: { language: "javascript", version: "18.15.0", filename: "main.js" },
  java: { language: "java", version: "15.0.2", filename: "Main.java" },
  cpp: { language: "c++", version: "10.2.0", filename: "main.cpp" },
  go: { language: "go", version: "1.16.2", filename: "main.go" },
};

const envInput = z.enum(["sandbox", "live"]).default("sandbox") as z.ZodType<PaymentsEnv>;

export const runCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string().min(1).max(20_000),
        language: PracticeProblemLanguageSchema,
        stdin: z.string().max(5000).optional().default(""),
        testRun: PracticeVisibleTestRunInputSchema.optional(),
        environment: envInput,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { plan } = await getUserPlan(userId, data.environment);
    const limit = (await getPlanQuotas())[plan].codeRunsPerDay;
    const allowed = await consumeQuota(userId, "code_run", limit, dayKey());
    if (!allowed) {
      return {
        ok: false as const,
        error: `Daily code-run limit reached (${limit}/day). Resets at UTC midnight.`,
      };
    }

    let code = data.code;
    let stdin = data.stdin ?? "";
    let rt = PISTON[data.language];

    if (data.testRun) {
      try {
        const wrapper = buildPracticeVisibleTestWrapper({
          language: data.language,
          functionName: data.testRun.functionName,
          visibleTests: data.testRun.visibleTests,
          userCode: data.code,
        });
        code = wrapper.code;
        stdin = "";
        rt = {
          ...rt,
          filename: wrapper.filename,
        };
      } catch (e: any) {
        console.error("runCode visible test wrapper failed:", e);
        const error = "This function signature is not supported by the test runner yet.";
        return {
          ok: true as const,
          stdout: "",
          stderr: error,
          exitCode: 1,
          compileStderr: "",
          ...buildPracticeExecutionFailure({
            status: "unsupported_signature",
            total: data.testRun.visibleTests.length,
            error,
          }),
        };
      }
    }

    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: rt.language,
          version: rt.version,
          files: [{ name: rt.filename, content: code }],
          stdin,
          run_timeout: 5000,
          compile_timeout: 10000,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Piston execute error:", res.status, text);
        return {
          ok: false as const,
          error: "Code execution service temporarily unavailable. Try again.",
        };
      }

      const json: any = await res.json();
      const stdout = (json?.run?.stdout ?? "") as string;
      const stderr = (json?.run?.stderr ?? "") as string;
      const exitCode = (json?.run?.code ?? 0) as number;
      const runSignal = (json?.run?.signal ?? null) as string | null;
      const compileStderr = (json?.compile?.stderr ?? "") as string;
      const normalizedTestRun = data.testRun
        ? normalizePracticeExecutionResult({
            stdout,
            stderr,
            exitCode,
            compileStderr,
            runSignal,
          })
        : {};

      return {
        ok: true as const,
        stdout,
        stderr,
        exitCode,
        compileStderr,
        ...normalizedTestRun,
      };
    } catch (e: any) {
      console.error("runCode failed:", e);
      return { ok: false as const, error: "Could not reach the code execution service." };
    }
  });
