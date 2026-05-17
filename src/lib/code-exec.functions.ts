import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PaddleEnv } from "@/lib/paddle.server";

const LANGS = ["python", "javascript", "java", "cpp"] as const;
type Lang = (typeof LANGS)[number];

// Piston runtime mappings. See https://emkc.org/api/v2/piston/runtimes
const PISTON: Record<Lang, { language: string; version: string; filename: string }> = {
  python: { language: "python", version: "3.10.0", filename: "main.py" },
  javascript: { language: "javascript", version: "18.15.0", filename: "main.js" },
  java: { language: "java", version: "15.0.2", filename: "Main.java" },
  cpp: { language: "c++", version: "10.2.0", filename: "main.cpp" },
};

const envInput = z.enum(["sandbox", "live"]).default("sandbox") as z.ZodType<PaddleEnv>;

export const runCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        code: z.string().min(1).max(20_000),
        language: z.enum(LANGS),
        stdin: z.string().max(5000).optional().default(""),
        environment: envInput,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const rt = PISTON[data.language];

    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: rt.language,
          version: rt.version,
          files: [{ name: rt.filename, content: data.code }],
          stdin: data.stdin ?? "",
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
      return {
        ok: true as const,
        stdout: (json?.run?.stdout ?? "") as string,
        stderr: (json?.run?.stderr ?? "") as string,
        exitCode: (json?.run?.code ?? 0) as number,
        compileStderr: (json?.compile?.stderr ?? "") as string,
      };
    } catch (e: any) {
      console.error("runCode failed:", e);
      return { ok: false as const, error: "Could not reach the code execution service." };
    }
  });
