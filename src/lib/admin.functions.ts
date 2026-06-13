import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isAdmin } from "./codewise.utils";
import { monthKey, refreshPlanQuotas } from "@/lib/entitlements.server";

export type CurriculumMapping = {
  topic_slug: string;
  sppu_course: string | null;
  sppu_module: string | null;
  nptel_course: string | null;
  nptel_module: string | null;
  year_semester: string | null;
};

export type AppConfig = Record<string, string>;

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const admin = supabaseAdmin;

    if (!(await isAdmin(userId))) {
      return { ok: false as const, error: "Forbidden", users: [], totals: {} };
    }

    const now = new Date();
    const mk = monthKey(now);

    const [profilesRes, subsRes, usageRes] = await Promise.all([
      admin
        .from("profiles")
        .select("id, display_name, created_at")
        .order("created_at", { ascending: false }),
      admin.from("subscriptions").select("user_id, status, current_period_end, environment"),
      admin.from("usage_counters").select("user_id, kind, count").eq("period_key", mk),
    ]);

    const profiles = profilesRes.data ?? [];
    const subs = subsRes.data ?? [];
    const usage = usageRes.data ?? [];

    const subByUser = new Map<string, { status: string; end: string | null }>();
    for (const s of subs) {
      const existing = subByUser.get(s.user_id);
      if (!existing || (s.status === "active" && existing.status !== "active")) {
        subByUser.set(s.user_id, {
          status: s.status as string,
          end: s.current_period_end as string | null,
        });
      }
    }

    const reviewCountByUser = new Map<string, number>();
    const roadmapCountByUser = new Map<string, number>();
    for (const u of usage) {
      if (u.kind === "review")
        reviewCountByUser.set(
          u.user_id,
          (reviewCountByUser.get(u.user_id) ?? 0) + (u.count as number),
        );
      else if (u.kind === "roadmap")
        roadmapCountByUser.set(
          u.user_id,
          (roadmapCountByUser.get(u.user_id) ?? 0) + (u.count as number),
        );
    }

    let totalReviews = 0;
    let totalPro = 0;
    const users = profiles.map((p) => {
      const s = subByUser.get(p.id);
      const endMs = s?.end ? new Date(s.end).getTime() : null;
      const inPeriod = endMs === null || endMs > now.getTime();
      const isPro =
        !!s &&
        ((["active", "trialing", "past_due"].includes(s.status) && inPeriod) ||
          (s.status === "canceled" && endMs !== null && endMs > now.getTime()));

      const reviews = reviewCountByUser.get(p.id) ?? 0;
      const roadmaps = roadmapCountByUser.get(p.id) ?? 0;
      totalReviews += reviews;
      if (isPro) totalPro++;

      return {
        id: p.id,
        display_name: p.display_name ?? "",
        created_at: p.created_at as string,
        plan: isPro ? "pro" : "free",
        subscription: s?.status ?? null,
        reviews_this_month: reviews,
        roadmaps_today: roadmaps,
      };
    });

    return {
      ok: true as const,
      users,
      totals: {
        users: users.length,
        pro_users: totalPro,
        reviews_this_month: totalReviews,
        free_users: users.length - totalPro,
      },
    };
  });

export const getAdminSeats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden", users: [] };

    const [profilesRes, rolesRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, display_name, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const rolesByUser = new Map<string, string[]>();
    for (const r of rolesRes.data ?? []) {
      const existing = rolesByUser.get(r.user_id) ?? [];
      existing.push(r.role as string);
      rolesByUser.set(r.user_id, existing);
    }

    const users = (profilesRes.data ?? []).map((p) => ({
      id: p.id,
      display_name: p.display_name ?? "",
      created_at: p.created_at as string,
      roles: rolesByUser.get(p.id) ?? [],
    }));

    return { ok: true as const, users };
  });

export const grantAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ targetUserId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.targetUserId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) {
      console.error("grantAdminRole failed:", error);
      return { ok: false as const, error: "Failed to grant admin role." };
    }
    return { ok: true as const };
  });

export const revokeAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ targetUserId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.targetUserId)
      .eq("role", "admin");
    if (error) {
      console.error("revokeAdminRole failed:", error);
      return { ok: false as const, error: "Failed to revoke admin role." };
    }
    return { ok: true as const };
  });

export const exportAllUserData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden", data: null };

    const [submissionsRes, issuesRes, progressRes, practiceRes] = await Promise.all([
      supabaseAdmin
        .from("submissions")
        .select("id, user_id, language, code, summary, concepts, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("review_issues")
        .select(
          "id, submission_id, user_id, line, severity, concept_slug, title, explanation, fix_hint",
        ),
      supabaseAdmin
        .from("progress")
        .select("user_id, topic_slug, mastery, attempts, last_reviewed"),
      supabaseAdmin
        .from("practice_problems")
        .select("id, user_id, topic_slug, title, prompt, starter_code, language, created_at"),
    ]);

    return {
      ok: true as const,
      data: {
        exported_at: new Date().toISOString(),
        submissions: submissionsRes.data ?? [],
        review_issues: issuesRes.data ?? [],
        progress: progressRes.data ?? [],
        practice_problems: practiceRes.data ?? [],
      },
    };
  });

export const getCurriculumMappings = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ mappings: CurriculumMapping[] }> => {
    const admin = supabaseAdmin as any;
    const { data } = await admin
      .from("curriculum_mappings")
      .select("topic_slug, sppu_course, sppu_module, nptel_course, nptel_module, year_semester")
      .order("topic_slug");
    return { mappings: (data ?? []) as CurriculumMapping[] };
  },
);

export const upsertCurriculumMapping = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topic_slug: z.string(),
        sppu_course: z.string().nullable().optional(),
        sppu_module: z.string().nullable().optional(),
        nptel_course: z.string().nullable().optional(),
        nptel_module: z.string().nullable().optional(),
        year_semester: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };

    const { error } = await (supabaseAdmin as any).from("curriculum_mappings").upsert(
      {
        topic_slug: data.topic_slug,
        sppu_course: data.sppu_course ?? null,
        sppu_module: data.sppu_module ?? null,
        nptel_course: data.nptel_course ?? null,
        nptel_module: data.nptel_module ?? null,
        year_semester: data.year_semester ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "topic_slug" },
    );
    if (error) {
      console.error("upsertCurriculumMapping failed:", error);
      return { ok: false as const, error: "Failed to save mapping." };
    }
    return { ok: true as const };
  });

export const getAppConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden", config: {} };
    const { data } = await supabaseAdmin.from("app_config").select("key, value");
    const config: AppConfig = {};
    for (const row of data ?? []) {
      config[row.key] = row.value as string;
    }
    return { ok: true as const, config };
  });

export const setAppConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ entries: z.array(z.object({ key: z.string().min(1), value: z.string() })) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (!(await isAdmin(userId))) return { ok: false as const, error: "Forbidden" };
    for (const entry of data.entries) {
      await supabaseAdmin
        .from("app_config")
        .upsert(
          { key: entry.key, value: entry.value, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
    }
    refreshPlanQuotas();
    return { ok: true as const };
  });
