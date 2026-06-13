import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getUserPlan,
  consumeQuota,
  getPlanQuotas,
  dayKey,
} from "@/lib/entitlements.server";
import { envInput, extractJson } from "./codewise.utils";
import { LANGS, VALID_TOPIC_SLUGS } from "@/lib/review.constants";

export const generatePractice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topicSlug: z.string().nullable().optional(),
        language: z.enum(LANGS).default("python"),
        environment: envInput,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI not configured." };

    // Entitlement check
    const { plan } = await getUserPlan(userId, data.environment);
    const limit = (await getPlanQuotas())[plan].problemsPerDay;
    const allowed = await consumeQuota(userId, "roadmap", limit, dayKey());
    if (!allowed) {
      return {
        ok: false as const,
        error:
          plan === "pro"
            ? `You've used all ${limit} roadmap generations today. Resets at UTC midnight.`
            : `Free plan limit reached (${limit} roadmap / day). Upgrade to Pro for 15/day.`,
        upgradeRequired: plan === "free",
      };
    }

    let topicSlug = data.topicSlug;
    if (!topicSlug) {
      const { data: weakest } = await supabase
        .from("progress")
        .select("topic_slug, mastery")
        .order("mastery", { ascending: true })
        .limit(1);
      topicSlug = weakest?.[0]?.topic_slug ?? "arrays";
    }
    if (!VALID_TOPIC_SLUGS.has(topicSlug)) topicSlug = "arrays";

    const { data: topic } = await supabase
      .from("topics")
      .select("name, description")
      .eq("slug", topicSlug)
      .maybeSingle();

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You generate small, focused CS practice problems for students. Difficulty: easy-medium (LeetCode Easy / classic CS1-CS2). Return JSON: { "title": string, "prompt": string (markdown ok, include examples + constraints), "starter_code": string (skeleton in the requested language with TODO comments) }. No markdown fences around the JSON.`,
          },
          {
            role: "user",
            content: `Topic: ${topic?.name ?? topicSlug}. ${topic?.description ?? ""}\nLanguage: ${data.language}\nGenerate ONE practice problem aimed at strengthening this concept.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return { ok: false as const, error: "Rate limited." };
      if (aiRes.status === 402) return { ok: false as const, error: "AI credits exhausted." };
      return { ok: false as const, error: "AI error generating problem." };
    }
    const aiJson = await aiRes.json();
    let content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";

    let parsed: { title: string; prompt: string; starter_code: string } | null = null;
    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        parsed = z
          .object({
            title: z.string().min(1).max(200),
            prompt: z.string().min(1).max(5000),
            starter_code: z.string().max(5000).optional().default(""),
          })
          .parse(JSON.parse(extractJson(content)));
        break;
      } catch (parseErr) {
        console.error(
          "generatePractice parse attempt",
          attempt,
          "failed:",
          parseErr,
          "content preview:",
          content.slice(0, 200),
        );
        if (attempt < maxAttempts) {
          const retryRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "openai/gpt-5-mini",
              messages: [
                {
                  role: "system",
                  content: `You generate small, focused CS practice problems for students. Difficulty: easy-medium (LeetCode Easy / classic CS1-CS2). Return JSON: { "title": string, "prompt": string (markdown ok, include examples + constraints), "starter_code": string (skeleton in the requested language with TODO comments) }. No markdown fences around the JSON.`,
                },
                {
                  role: "user",
                  content: `Topic: ${topic?.name ?? topicSlug}. ${topic?.description ?? ""}\nLanguage: ${data.language}\nGenerate ONE practice problem aimed at strengthening this concept.`,
                },
              ],
              response_format: { type: "json_object" },
            }),
          });
          if (!retryRes.ok) {
            console.error("AI gateway retry error:", retryRes.status);
            continue;
          }
          const retryJson = await retryRes.json();
          content = retryJson?.choices?.[0]?.message?.content ?? "{}";
        }
      }
    }
    if (!parsed) {
      console.error("generatePracticeProblem: malformed AI output after 3 attempts. Raw preview:", content.slice(0, 500));
      return {
        ok: false as const,
        error: "AI returned an unexpected response. Please try again.",
      };
    }

    const { data: row, error } = await supabase
      .from("practice_problems")
      .insert({
        user_id: userId,
        topic_slug: topicSlug,
        title: parsed.title,
        prompt: parsed.prompt,
        starter_code: parsed.starter_code,
        language: data.language,
      })
      .select("*")
      .single();
    if (error || !row) {
      console.error("generatePractice insert failed:", error);
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }
    return { ok: true as const, problem: row };
  });

export const listPractice = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("practice_problems")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    return { problems: data ?? [] };
  });
